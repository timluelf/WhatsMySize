import { GameState, awayTotal, homeTotal } from './scoring';
import { isSupabaseConfigured, supabase } from './supabase';

export type StoredGameSummary = {
  id: string;
  awayName: string;
  homeName: string;
  awayAbbr: string;
  homeAbbr: string;
  awayScore: number;
  homeScore: number;
  inning: number;
  half: 'top' | 'bottom';
  status: 'in_progress' | 'final';
  updatedAt: string;
};

type DbRow = {
  id: string;
  state: GameState;
  away_team_name: string;
  home_team_name: string;
  away_team_abbr: string;
  home_team_abbr: string;
  away_score: number;
  home_score: number;
  inning: number;
  half: 'top' | 'bottom';
  status: 'in_progress' | 'final';
  updated_at: string;
};

function projection(state: GameState) {
  return {
    state,
    away_team_id: state.away.id,
    home_team_id: state.home.id,
    away_team_name: state.away.name,
    home_team_name: state.home.name,
    away_team_abbr: state.away.abbreviation,
    home_team_abbr: state.home.abbreviation,
    away_score: awayTotal(state),
    home_score: homeTotal(state),
    inning: state.inning,
    half: state.half,
    total_innings: state.totalInnings,
    status: state.status,
    tournament_match_id: state.tournamentMatchId,
  };
}

export async function createGameRecord(
  state: GameState,
  userId: string
): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase!
    .from('games')
    .insert({ ...projection(state), created_by: userId })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export async function saveGameRecord(id: string, state: GameState): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase!.from('games').update(projection(state)).eq('id', id);
  if (error) throw error;
  if (state.status === 'final' && state.tournamentMatchId) {
    await maybeAdvanceMatch(state, id);
  }
}

async function maybeAdvanceMatch(state: GameState, gameId: string): Promise<void> {
  if (!isSupabaseConfigured || !state.tournamentMatchId) return;
  const { data: match, error } = await supabase!
    .from('tournament_matches')
    .select('id, team_a_id, team_b_id, winner_team_id')
    .eq('id', state.tournamentMatchId)
    .maybeSingle();
  if (error || !match || match.winner_team_id) return;

  const awayId = state.away.id;
  const homeId = state.home.id;
  const awayR = awayTotal(state);
  const homeR = homeTotal(state);
  if (awayR === homeR) return; // tie can't advance

  let teamAScore: number;
  let teamBScore: number;
  let winnerId: string;
  if (match.team_a_id === awayId && match.team_b_id === homeId) {
    teamAScore = awayR;
    teamBScore = homeR;
    winnerId = awayR > homeR ? awayId : homeId;
  } else if (match.team_a_id === homeId && match.team_b_id === awayId) {
    teamAScore = homeR;
    teamBScore = awayR;
    winnerId = homeR > awayR ? homeId : awayId;
  } else {
    return;
  }

  const { error: updateErr } = await supabase!
    .from('tournament_matches')
    .update({
      team_a_score: teamAScore,
      team_b_score: teamBScore,
      winner_team_id: winnerId,
      game_id: gameId,
    })
    .eq('id', match.id);
  if (updateErr) return;

  // Advance the winner into the next round.
  const { data: thisMatch } = await supabase!
    .from('tournament_matches')
    .select('tournament_id, round, slot')
    .eq('id', match.id)
    .single();
  if (!thisMatch) return;

  const { data: nextMatch } = await supabase!
    .from('tournament_matches')
    .select('id')
    .eq('tournament_id', thisMatch.tournament_id)
    .eq('round', thisMatch.round + 1)
    .eq('slot', Math.floor(thisMatch.slot / 2))
    .maybeSingle();

  if (nextMatch) {
    const slotInNext = thisMatch.slot % 2 === 0 ? 'team_a_id' : 'team_b_id';
    await supabase!
      .from('tournament_matches')
      .update({ [slotInNext]: winnerId })
      .eq('id', nextMatch.id);
  } else {
    await supabase!
      .from('tournaments')
      .update({ status: 'final' })
      .eq('id', thisMatch.tournament_id);
  }
}

export async function listRecentGames(userId: string): Promise<StoredGameSummary[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase!
    .from('games')
    .select(
      'id, away_team_name, home_team_name, away_team_abbr, home_team_abbr, away_score, home_score, inning, half, status, updated_at'
    )
    .eq('created_by', userId)
    .order('updated_at', { ascending: false })
    .limit(10);
  if (error) throw error;
  return (data ?? []).map(rowToSummary);
}

export async function listGamesForTeam(teamId: string): Promise<GameState[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase!
    .from('games')
    .select('state')
    .or(`away_team_id.eq.${teamId},home_team_id.eq.${teamId}`)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => row.state as GameState);
}

export async function loadGameRecord(id: string): Promise<GameState | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase!
    .from('games')
    .select('state')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data?.state as GameState | undefined) ?? null;
}

export async function deleteGameRecord(id: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase!.from('games').delete().eq('id', id);
  if (error) throw error;
}

function rowToSummary(row: Omit<DbRow, 'state'>): StoredGameSummary {
  return {
    id: row.id,
    awayName: row.away_team_name,
    homeName: row.home_team_name,
    awayAbbr: row.away_team_abbr,
    homeAbbr: row.home_team_abbr,
    awayScore: row.away_score,
    homeScore: row.home_score,
    inning: row.inning,
    half: row.half,
    status: row.status,
    updatedAt: row.updated_at,
  };
}
