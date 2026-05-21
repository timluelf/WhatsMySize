import { GameState } from './scoring';
import {
  LeagueLeaders,
  LeagueStanding,
  computeLeaders,
  computeStandings,
} from './leagueStats';
import { TournamentTeam } from './tournaments';
import { isSupabaseConfigured, supabase } from './supabase';

export type TournamentLeaders = LeagueLeaders;
export type TournamentStanding = LeagueStanding;

export async function fetchTournamentGames(
  gameIds: string[]
): Promise<GameState[]> {
  if (!isSupabaseConfigured || gameIds.length === 0) return [];
  const { data, error } = await supabase!
    .from('games')
    .select('state')
    .in('id', gameIds)
    .eq('status', 'final');
  if (error) throw error;
  return (data ?? []).map((row) => row.state as GameState);
}

export function computeTournamentLeaders(
  games: GameState[],
  teams: TournamentTeam[]
): TournamentLeaders {
  const asLeagueTeams = teams.map((t) => ({ id: t.id, name: t.name }));
  return computeLeaders(games, asLeagueTeams);
}

export function computeTournamentStandings(
  games: GameState[],
  teams: TournamentTeam[]
): TournamentStanding[] {
  const asLeagueTeams = teams.map((t) => ({ id: t.id, name: t.name }));
  return computeStandings(games, asLeagueTeams);
}
