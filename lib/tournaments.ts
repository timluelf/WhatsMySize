import { isSupabaseConfigured, supabase } from './supabase';

export type TournamentStatus = 'open' | 'in_progress' | 'final';

export type Tournament = {
  id: string;
  name: string;
  description: string | null;
  size: number;
  joinCode: string;
  status: TournamentStatus;
  createdBy: string;
};

export type TournamentTeam = {
  id: string;
  name: string;
  seed: number | null;
};

export type TournamentMatch = {
  id: string;
  tournamentId: string;
  round: number;
  slot: number;
  teamAId: string | null;
  teamBId: string | null;
  teamAScore: number | null;
  teamBScore: number | null;
  winnerTeamId: string | null;
  gameId: string | null;
};

export type TournamentDetail = Tournament & {
  teams: TournamentTeam[];
  matches: TournamentMatch[];
};

type TournamentRow = {
  id: string;
  name: string;
  description: string | null;
  size: number;
  join_code: string;
  status: TournamentStatus;
  created_by: string;
};

type MatchRow = {
  id: string;
  tournament_id: string;
  round: number;
  slot: number;
  team_a_id: string | null;
  team_b_id: string | null;
  team_a_score: number | null;
  team_b_score: number | null;
  winner_team_id: string | null;
  game_id: string | null;
};

export async function createTournament(params: {
  name: string;
  description: string | null;
  size: number;
  userId: string;
}): Promise<Tournament> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');
  const { data, error } = await supabase!
    .from('tournaments')
    .insert({
      name: params.name.trim(),
      description: params.description?.trim() || null,
      size: params.size,
      created_by: params.userId,
    })
    .select('id, name, description, size, join_code, status, created_by')
    .single();
  if (error) throw error;
  return rowToTournament(data);
}

export async function joinTournamentByCode(
  code: string,
  teamId: string
): Promise<Tournament> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');
  const trimmed = code.trim();
  if (!trimmed) throw new Error('Enter a tournament code');

  const { data: tournament, error } = await supabase!
    .from('tournaments')
    .select('id, name, description, size, join_code, status, created_by')
    .eq('join_code', trimmed)
    .maybeSingle();
  if (error) throw error;
  if (!tournament) throw new Error('No tournament found with that code');
  if (tournament.status !== 'open') {
    throw new Error('Tournament has already started');
  }

  // Capacity check
  const { count } = await supabase!
    .from('tournament_teams')
    .select('*', { count: 'exact', head: true })
    .eq('tournament_id', tournament.id);
  if ((count ?? 0) >= tournament.size) {
    throw new Error('Tournament is full');
  }

  const { error: joinErr } = await supabase!
    .from('tournament_teams')
    .insert({ tournament_id: tournament.id, team_id: teamId });
  if (joinErr && !joinErr.message.toLowerCase().includes('duplicate')) {
    throw joinErr;
  }
  return rowToTournament(tournament);
}

export async function leaveTournament(tournamentId: string, teamId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase!
    .from('tournament_teams')
    .delete()
    .eq('tournament_id', tournamentId)
    .eq('team_id', teamId);
  if (error) throw error;
}

export async function listTournamentsForTeam(teamId: string): Promise<Tournament[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase!
    .from('tournament_teams')
    .select('tournaments(id, name, description, size, join_code, status, created_by)')
    .eq('team_id', teamId);
  if (error) throw error;
  const out: Tournament[] = [];
  for (const row of (data ?? []) as unknown as { tournaments: TournamentRow | TournamentRow[] | null }[]) {
    const t = Array.isArray(row.tournaments) ? row.tournaments[0] : row.tournaments;
    if (t) out.push(rowToTournament(t));
  }
  return out;
}

export async function listTournamentsCreatedBy(userId: string): Promise<Tournament[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase!
    .from('tournaments')
    .select('id, name, description, size, join_code, status, created_by')
    .eq('created_by', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToTournament);
}

export async function getTournament(id: string): Promise<TournamentDetail | null> {
  if (!isSupabaseConfigured) return null;
  const { data: tourny, error } = await supabase!
    .from('tournaments')
    .select(
      'id, name, description, size, join_code, status, created_by, tournament_teams(seed, teams(id, name))'
    )
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!tourny) return null;

  const teamsRaw = (tourny.tournament_teams as unknown as {
    seed: number | null;
    teams: { id: string; name: string } | { id: string; name: string }[];
  }[]) ?? [];
  const teams: TournamentTeam[] = teamsRaw
    .map((row) => {
      const t = Array.isArray(row.teams) ? row.teams[0] : row.teams;
      if (!t) return null;
      return { id: t.id, name: t.name, seed: row.seed };
    })
    .filter((t): t is TournamentTeam => !!t)
    .sort((a, b) => (a.seed ?? 999) - (b.seed ?? 999));

  const { data: matchRows, error: matchErr } = await supabase!
    .from('tournament_matches')
    .select(
      'id, tournament_id, round, slot, team_a_id, team_b_id, team_a_score, team_b_score, winner_team_id, game_id'
    )
    .eq('tournament_id', id)
    .order('round', { ascending: true })
    .order('slot', { ascending: true });
  if (matchErr) throw matchErr;

  const matches: TournamentMatch[] = (matchRows ?? []).map(rowToMatch);

  return { ...rowToTournament(tourny), teams, matches };
}

/**
 * Generate a single-elimination bracket. Seeds teams 1..N by join order
 * (or shuffled if randomize=true), pairs them 1v8, 2v7, 3v6, 4v5 etc, and
 * creates placeholder matches for all subsequent rounds.
 */
export async function generateBracket(
  tournamentId: string,
  randomize = false
): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');

  const { data: t, error: tErr } = await supabase!
    .from('tournaments')
    .select('id, size, status')
    .eq('id', tournamentId)
    .single();
  if (tErr) throw tErr;
  if (t.status !== 'open') throw new Error('Bracket already generated');

  const { data: tt, error: ttErr } = await supabase!
    .from('tournament_teams')
    .select('team_id, joined_at')
    .eq('tournament_id', tournamentId)
    .order('joined_at', { ascending: true });
  if (ttErr) throw ttErr;
  if ((tt?.length ?? 0) < t.size) {
    throw new Error(`Need ${t.size} teams to start; have ${tt?.length ?? 0}`);
  }

  let teamIds = (tt ?? []).map((r) => r.team_id as string);
  if (randomize) {
    for (let i = teamIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [teamIds[i], teamIds[j]] = [teamIds[j], teamIds[i]];
    }
  }

  // Assign seeds 1..N
  const seedUpdates = teamIds.map((teamId, idx) => ({
    tournament_id: tournamentId,
    team_id: teamId,
    seed: idx + 1,
  }));
  // upsert seeds
  for (const u of seedUpdates) {
    const { error: e } = await supabase!
      .from('tournament_teams')
      .update({ seed: u.seed })
      .eq('tournament_id', u.tournament_id)
      .eq('team_id', u.team_id);
    if (e) throw e;
  }

  // Standard seeding pairings: 1v8, 4v5, 3v6, 2v7 for size 8 etc.
  const round1 = standardSeedPairings(t.size).map(([a, b]) => [
    teamIds[a - 1],
    teamIds[b - 1],
  ]);

  const matchesToInsert: Array<{
    tournament_id: string;
    round: number;
    slot: number;
    team_a_id: string | null;
    team_b_id: string | null;
  }> = [];

  // Round 1: actual teams
  round1.forEach((pair, slot) => {
    matchesToInsert.push({
      tournament_id: tournamentId,
      round: 1,
      slot,
      team_a_id: pair[0],
      team_b_id: pair[1],
    });
  });

  // Subsequent rounds: empty placeholders
  let count = t.size / 2;
  let round = 2;
  while (count > 1) {
    count = count / 2;
    for (let slot = 0; slot < count; slot++) {
      matchesToInsert.push({
        tournament_id: tournamentId,
        round,
        slot,
        team_a_id: null,
        team_b_id: null,
      });
    }
    round += 1;
  }

  const { error: insertErr } = await supabase!
    .from('tournament_matches')
    .insert(matchesToInsert);
  if (insertErr) throw insertErr;

  const { error: statusErr } = await supabase!
    .from('tournaments')
    .update({ status: 'in_progress' })
    .eq('id', tournamentId);
  if (statusErr) throw statusErr;
}

/**
 * Record the result of a single match and advance the winner into the next
 * round. If this was the final match, mark the tournament as final.
 */
export async function reportMatchResult(params: {
  matchId: string;
  teamAScore: number;
  teamBScore: number;
}): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');

  const { data: match, error } = await supabase!
    .from('tournament_matches')
    .select(
      'id, tournament_id, round, slot, team_a_id, team_b_id'
    )
    .eq('id', params.matchId)
    .single();
  if (error) throw error;
  if (!match.team_a_id || !match.team_b_id) {
    throw new Error('Match teams not set yet');
  }
  if (params.teamAScore === params.teamBScore) {
    throw new Error('Pick a winner — no ties in a bracket');
  }

  const winnerId =
    params.teamAScore > params.teamBScore ? match.team_a_id : match.team_b_id;

  const { error: updateErr } = await supabase!
    .from('tournament_matches')
    .update({
      team_a_score: params.teamAScore,
      team_b_score: params.teamBScore,
      winner_team_id: winnerId,
    })
    .eq('id', match.id);
  if (updateErr) throw updateErr;

  // Advance to next round
  const { data: nextMatch, error: nextErr } = await supabase!
    .from('tournament_matches')
    .select('id, team_a_id, team_b_id')
    .eq('tournament_id', match.tournament_id)
    .eq('round', match.round + 1)
    .eq('slot', Math.floor(match.slot / 2))
    .maybeSingle();
  if (nextErr) throw nextErr;

  if (nextMatch) {
    const slotInNext = match.slot % 2 === 0 ? 'team_a_id' : 'team_b_id';
    const { error: advErr } = await supabase!
      .from('tournament_matches')
      .update({ [slotInNext]: winnerId })
      .eq('id', nextMatch.id);
    if (advErr) throw advErr;
  } else {
    // No next match: this was the final.
    await supabase!
      .from('tournaments')
      .update({ status: 'final' })
      .eq('id', match.tournament_id);
  }
}

export async function getTeamCount(tournamentId: string): Promise<number> {
  if (!isSupabaseConfigured) return 0;
  const { count } = await supabase!
    .from('tournament_teams')
    .select('*', { count: 'exact', head: true })
    .eq('tournament_id', tournamentId);
  return count ?? 0;
}

function rowToTournament(row: TournamentRow): Tournament {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    size: row.size,
    joinCode: row.join_code,
    status: row.status,
    createdBy: row.created_by,
  };
}

function rowToMatch(row: MatchRow): TournamentMatch {
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    round: row.round,
    slot: row.slot,
    teamAId: row.team_a_id,
    teamBId: row.team_b_id,
    teamAScore: row.team_a_score,
    teamBScore: row.team_b_score,
    winnerTeamId: row.winner_team_id,
    gameId: row.game_id,
  };
}

/** 1v8, 4v5, 3v6, 2v7 style — pairs strong-vs-weak, semis don't repeat. */
function standardSeedPairings(size: number): Array<[number, number]> {
  // Build the bracket order using bit-reversal-like pattern.
  // For size=8: returns [[1,8],[4,5],[3,6],[2,7]].
  const order: number[] = [1];
  while (order.length < size) {
    const next: number[] = [];
    const target = order.length * 2;
    for (const s of order) {
      next.push(s);
      next.push(target + 1 - s);
    }
    order.splice(0, order.length, ...next);
  }
  const out: Array<[number, number]> = [];
  for (let i = 0; i < order.length; i += 2) {
    out.push([order[i], order[i + 1]]);
  }
  return out;
}
