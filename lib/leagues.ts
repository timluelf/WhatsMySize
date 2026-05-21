import { isSupabaseConfigured, supabase } from './supabase';

export type League = {
  id: string;
  name: string;
  description: string | null;
  joinCode: string;
  createdBy: string;
};

export type LeagueTeam = {
  id: string;
  name: string;
};

export type LeagueWithTeams = League & {
  teams: LeagueTeam[];
};

type LeagueRow = {
  id: string;
  name: string;
  description: string | null;
  join_code: string;
  created_by: string;
};

export async function createLeague(params: {
  name: string;
  description: string | null;
  userId: string;
  teamId: string;
}): Promise<League> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');
  const { data, error } = await supabase!
    .from('leagues')
    .insert({
      name: params.name.trim(),
      description: params.description?.trim() || null,
      created_by: params.userId,
    })
    .select('id, name, description, join_code, created_by')
    .single();
  if (error) throw error;

  // Auto-join the creator's team.
  const { error: joinErr } = await supabase!
    .from('league_teams')
    .insert({ league_id: data.id, team_id: params.teamId });
  if (joinErr && !joinErr.message.toLowerCase().includes('duplicate')) {
    throw joinErr;
  }

  return rowToLeague(data);
}

export async function joinLeagueByCode(code: string, teamId: string): Promise<League> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');
  const trimmed = code.trim();
  if (!trimmed) throw new Error('Enter a league code');

  const { data: league, error } = await supabase!
    .from('leagues')
    .select('id, name, description, join_code, created_by')
    .eq('join_code', trimmed)
    .maybeSingle();
  if (error) throw error;
  if (!league) throw new Error('No league found with that code');

  const { error: joinErr } = await supabase!
    .from('league_teams')
    .insert({ league_id: league.id, team_id: teamId });
  if (joinErr && !joinErr.message.toLowerCase().includes('duplicate')) {
    throw joinErr;
  }

  return rowToLeague(league);
}

export async function leaveLeague(leagueId: string, teamId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase!
    .from('league_teams')
    .delete()
    .eq('league_id', leagueId)
    .eq('team_id', teamId);
  if (error) throw error;
}

export async function getLeague(leagueId: string): Promise<LeagueWithTeams | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase!
    .from('leagues')
    .select(
      'id, name, description, join_code, created_by, league_teams(team_id, teams(id, name))'
    )
    .eq('id', leagueId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const teamRows = (data.league_teams as unknown as { teams: LeagueTeam | LeagueTeam[] }[]) ?? [];
  const teams: LeagueTeam[] = teamRows
    .map((row) => (Array.isArray(row.teams) ? row.teams[0] : row.teams))
    .filter(Boolean);

  return { ...rowToLeague(data), teams };
}

export async function listLeaguesForTeam(teamId: string): Promise<League[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase!
    .from('league_teams')
    .select('leagues(id, name, description, join_code, created_by)')
    .eq('team_id', teamId);
  if (error) throw error;
  const out: League[] = [];
  for (const row of (data ?? []) as unknown as { leagues: LeagueRow | LeagueRow[] | null }[]) {
    const lg = Array.isArray(row.leagues) ? row.leagues[0] : row.leagues;
    if (lg) out.push(rowToLeague(lg));
  }
  return out;
}

function rowToLeague(row: LeagueRow): League {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    joinCode: row.join_code,
    createdBy: row.created_by,
  };
}
