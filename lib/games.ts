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
