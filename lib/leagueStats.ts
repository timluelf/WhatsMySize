import { GameState } from './scoring';
import { LeagueTeam } from './leagues';
import { computeTeamBoxScore, PlayerLine } from './stats';
import { isSupabaseConfigured, supabase } from './supabase';

export type LeagueStanding = {
  team: LeagueTeam;
  wins: number;
  losses: number;
  ties: number;
  gamesPlayed: number;
  runsFor: number;
  runsAgainst: number;
  runDiff: number;
};

export type LeaderRow = {
  playerId: string;
  playerName: string;
  playerNumber: number | undefined;
  teamId: string;
  teamName: string;
  ab: number;
  h: number;
  hr: number;
  rbi: number;
  r: number;
  avg: number;
};

export type LeagueLeaders = {
  battingAvg: LeaderRow[];
  homeRuns: LeaderRow[];
  rbi: LeaderRow[];
  runs: LeaderRow[];
};

const MIN_AB_FOR_AVG = 3;

export async function fetchLeagueGames(teamIds: string[]): Promise<GameState[]> {
  if (!isSupabaseConfigured || teamIds.length === 0) return [];
  // Both teams must be in this league for the game to count.
  const { data, error } = await supabase!
    .from('games')
    .select('state')
    .eq('status', 'final')
    .in('away_team_id', teamIds)
    .in('home_team_id', teamIds);
  if (error) throw error;
  return (data ?? []).map((row) => row.state as GameState);
}

export function computeStandings(
  games: GameState[],
  teams: LeagueTeam[]
): LeagueStanding[] {
  const map = new Map<string, LeagueStanding>();
  for (const team of teams) {
    map.set(team.id, {
      team,
      wins: 0,
      losses: 0,
      ties: 0,
      gamesPlayed: 0,
      runsFor: 0,
      runsAgainst: 0,
      runDiff: 0,
    });
  }

  for (const game of games) {
    const away = map.get(game.away.id);
    const home = map.get(game.home.id);
    if (!away || !home) continue;
    const awayR = sum(game.awayScoreByInning);
    const homeR = sum(game.homeScoreByInning);

    away.gamesPlayed += 1;
    home.gamesPlayed += 1;
    away.runsFor += awayR;
    away.runsAgainst += homeR;
    home.runsFor += homeR;
    home.runsAgainst += awayR;

    if (awayR > homeR) {
      away.wins += 1;
      home.losses += 1;
    } else if (homeR > awayR) {
      home.wins += 1;
      away.losses += 1;
    } else {
      away.ties += 1;
      home.ties += 1;
    }
  }

  return Array.from(map.values())
    .map((s) => ({ ...s, runDiff: s.runsFor - s.runsAgainst }))
    .sort((a, b) => {
      if (a.wins !== b.wins) return b.wins - a.wins;
      if (a.losses !== b.losses) return a.losses - b.losses;
      return b.runDiff - a.runDiff;
    });
}

export function computeLeaders(
  games: GameState[],
  teams: LeagueTeam[]
): LeagueLeaders {
  const teamNameById = new Map(teams.map((t) => [t.id, t.name]));
  const teamIds = new Set(teams.map((t) => t.id));

  type Acc = LeaderRow & { games: number };
  const players = new Map<string, Acc>();

  for (const game of games) {
    for (const side of ['away', 'home'] as const) {
      const team = side === 'away' ? game.away : game.home;
      if (!teamIds.has(team.id)) continue;
      const lines: PlayerLine[] = computeTeamBoxScore(game, side).lines;
      for (const line of lines) {
        if (line.ab === 0 && line.bb === 0 && line.r === 0 && line.rbi === 0) continue;
        const existing = players.get(line.player.id) ?? {
          playerId: line.player.id,
          playerName: line.player.name,
          playerNumber: line.player.number,
          teamId: team.id,
          teamName: teamNameById.get(team.id) ?? team.name,
          ab: 0,
          h: 0,
          hr: 0,
          rbi: 0,
          r: 0,
          avg: 0,
          games: 0,
        };
        existing.ab += line.ab;
        existing.h += line.h;
        existing.hr += line.hrs;
        existing.rbi += line.rbi;
        existing.r += line.r;
        existing.games += 1;
        players.set(line.player.id, existing);
      }
    }
  }

  const rows = Array.from(players.values()).map((p) => ({
    ...p,
    avg: p.ab > 0 ? p.h / p.ab : 0,
  }));

  return {
    battingAvg: rows
      .filter((r) => r.ab >= MIN_AB_FOR_AVG)
      .sort((a, b) => b.avg - a.avg || b.h - a.h)
      .slice(0, 5),
    homeRuns: rows
      .filter((r) => r.hr > 0)
      .sort((a, b) => b.hr - a.hr)
      .slice(0, 5),
    rbi: rows
      .filter((r) => r.rbi > 0)
      .sort((a, b) => b.rbi - a.rbi)
      .slice(0, 5),
    runs: rows
      .filter((r) => r.r > 0)
      .sort((a, b) => b.r - a.r)
      .slice(0, 5),
  };
}

function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}
