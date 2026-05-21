import { AtBatRecord, GameState, PlayEvent, Player, Team } from './scoring';

export type PlayerLine = {
  player: Player;
  inLineup: boolean;
  battingOrder: number | null;
  ab: number;
  r: number;
  h: number;
  rbi: number;
  bb: number;
  k: number;
  doubles: number;
  triples: number;
  hrs: number;
};

export type TeamBoxScore = {
  team: Team;
  lines: PlayerLine[];
  totals: Omit<PlayerLine, 'player' | 'inLineup' | 'battingOrder'>;
};

const HIT_EVENTS: PlayEvent[] = ['single', 'double', 'triple', 'hr'];
// At-bats exclude walks and sacrifices (standard baseball scoring).
const AB_EVENTS: PlayEvent[] = [
  'single',
  'double',
  'triple',
  'hr',
  'strikeout',
  'out',
  'error',
  'double_play',
];
// Runs that score on an error or DP are not credited as RBI to the batter.
const NO_RBI_EVENTS: PlayEvent[] = ['error', 'double_play'];

export function computeTeamBoxScore(
  game: GameState,
  side: 'away' | 'home'
): TeamBoxScore {
  const team = side === 'away' ? game.away : game.home;
  const lineup = side === 'away' ? game.awayLineup : game.homeLineup;
  const history = game.history.filter((h) => h.battingTeamId === team.id);

  const lines: PlayerLine[] = team.players.map((player) => {
    const orderIndex = lineup.indexOf(player.id);
    return {
      player,
      inLineup: orderIndex !== -1,
      battingOrder: orderIndex === -1 ? null : orderIndex + 1,
      ...buildStats(player.id, history),
    };
  });

  lines.sort((a, b) => {
    if (a.inLineup !== b.inLineup) return a.inLineup ? -1 : 1;
    return (a.battingOrder ?? 99) - (b.battingOrder ?? 99);
  });

  const totals = lines.reduce(
    (acc, line) => ({
      ab: acc.ab + line.ab,
      r: acc.r + line.r,
      h: acc.h + line.h,
      rbi: acc.rbi + line.rbi,
      bb: acc.bb + line.bb,
      k: acc.k + line.k,
      doubles: acc.doubles + line.doubles,
      triples: acc.triples + line.triples,
      hrs: acc.hrs + line.hrs,
    }),
    { ab: 0, r: 0, h: 0, rbi: 0, bb: 0, k: 0, doubles: 0, triples: 0, hrs: 0 }
  );

  return { team, lines, totals };
}

function buildStats(playerId: string, history: AtBatRecord[]) {
  let ab = 0;
  let h = 0;
  let rbi = 0;
  let bb = 0;
  let k = 0;
  let doubles = 0;
  let triples = 0;
  let hrs = 0;

  for (const record of history) {
    if (record.batterId === playerId) {
      if (AB_EVENTS.includes(record.event)) ab += 1;
      if (HIT_EVENTS.includes(record.event)) h += 1;
      if (record.event === 'double') doubles += 1;
      if (record.event === 'triple') triples += 1;
      if (record.event === 'hr') hrs += 1;
      if (record.event === 'walk') bb += 1;
      if (record.event === 'strikeout') k += 1;
      if (!NO_RBI_EVENTS.includes(record.event)) rbi += record.runsScored;
    }
  }

  // Runs are credited to whoever crosses home, regardless of who batted.
  const r = history.reduce(
    (acc, record) => acc + record.runnersScored.filter((id) => id === playerId).length,
    0
  );

  return { ab, r, h, rbi, bb, k, doubles, triples, hrs };
}

export function formatAvg(h: number, ab: number): string {
  if (ab === 0) return '.---';
  const avg = h / ab;
  return avg.toFixed(3).replace(/^0/, '');
}

export type SeasonPlayerStats = {
  player: Player;
  games: number;
  ab: number;
  r: number;
  h: number;
  rbi: number;
  bb: number;
  k: number;
  doubles: number;
  triples: number;
  hrs: number;
};

export type SeasonRecord = { wins: number; losses: number; ties: number };

export type TeamSeasonStats = {
  teamId: string;
  teamName: string;
  teamAbbreviation: string;
  players: SeasonPlayerStats[];
  totals: Omit<SeasonPlayerStats, 'player' | 'games'>;
  record: SeasonRecord;
  gamesPlayed: number;
  gamesFinal: number;
};

export function computeSeasonStats(
  games: GameState[],
  teamId: string
): TeamSeasonStats {
  // Only finalized games count toward W-L record and stats. (Adjust later if
  // you want in-progress games to show provisional lines.)
  const final = games.filter((g) => g.status === 'final');

  // Build a master roster: every player who ever appeared for this team,
  // preferring the most recent appearance for name/number.
  const playerMap = new Map<string, Player>();
  let teamName = '';
  let teamAbbr = '';

  for (const game of [...final].reverse()) {
    const teamOnGame = game.away.id === teamId ? game.away : game.home;
    if (!teamName) {
      teamName = teamOnGame.name;
      teamAbbr = teamOnGame.abbreviation;
    }
    for (const player of teamOnGame.players) {
      if (!playerMap.has(player.id)) {
        playerMap.set(player.id, player);
      }
    }
  }

  // Aggregate per-game stats per player.
  const perPlayer = new Map<
    string,
    Omit<SeasonPlayerStats, 'player'> & { gameIds: Set<string> }
  >();

  for (const game of final) {
    const side: 'away' | 'home' = game.away.id === teamId ? 'away' : 'home';
    const lines = computeTeamBoxScore(game, side).lines;
    for (const line of lines) {
      if (!playerMap.has(line.player.id)) playerMap.set(line.player.id, line.player);
      const existing = perPlayer.get(line.player.id) ?? {
        games: 0,
        ab: 0,
        r: 0,
        h: 0,
        rbi: 0,
        bb: 0,
        k: 0,
        doubles: 0,
        triples: 0,
        hrs: 0,
        gameIds: new Set<string>(),
      };
      const playerHadAppearance =
        line.ab > 0 || line.bb > 0 || line.r > 0 || line.rbi > 0;
      if (playerHadAppearance) {
        existing.gameIds.add(idOfGame(game));
      }
      existing.ab += line.ab;
      existing.r += line.r;
      existing.h += line.h;
      existing.rbi += line.rbi;
      existing.bb += line.bb;
      existing.k += line.k;
      existing.doubles += line.doubles;
      existing.triples += line.triples;
      existing.hrs += line.hrs;
      perPlayer.set(line.player.id, existing);
    }
  }

  const players: SeasonPlayerStats[] = Array.from(playerMap.values())
    .map((player) => {
      const data = perPlayer.get(player.id);
      return {
        player,
        games: data?.gameIds.size ?? 0,
        ab: data?.ab ?? 0,
        r: data?.r ?? 0,
        h: data?.h ?? 0,
        rbi: data?.rbi ?? 0,
        bb: data?.bb ?? 0,
        k: data?.k ?? 0,
        doubles: data?.doubles ?? 0,
        triples: data?.triples ?? 0,
        hrs: data?.hrs ?? 0,
      };
    })
    .sort((a, b) => {
      // AVG desc (for players with PA); then by name
      const avgA = a.ab > 0 ? a.h / a.ab : -1;
      const avgB = b.ab > 0 ? b.h / b.ab : -1;
      if (avgA !== avgB) return avgB - avgA;
      return a.player.name.localeCompare(b.player.name);
    });

  const totals = players.reduce(
    (acc, p) => ({
      ab: acc.ab + p.ab,
      r: acc.r + p.r,
      h: acc.h + p.h,
      rbi: acc.rbi + p.rbi,
      bb: acc.bb + p.bb,
      k: acc.k + p.k,
      doubles: acc.doubles + p.doubles,
      triples: acc.triples + p.triples,
      hrs: acc.hrs + p.hrs,
    }),
    { ab: 0, r: 0, h: 0, rbi: 0, bb: 0, k: 0, doubles: 0, triples: 0, hrs: 0 }
  );

  let wins = 0;
  let losses = 0;
  let ties = 0;
  for (const game of final) {
    const isAway = game.away.id === teamId;
    const myRuns = (isAway ? game.awayScoreByInning : game.homeScoreByInning).reduce(
      (a, b) => a + b,
      0
    );
    const oppRuns = (isAway ? game.homeScoreByInning : game.awayScoreByInning).reduce(
      (a, b) => a + b,
      0
    );
    if (myRuns > oppRuns) wins += 1;
    else if (myRuns < oppRuns) losses += 1;
    else ties += 1;
  }

  return {
    teamId,
    teamName: teamName || 'Team',
    teamAbbreviation: teamAbbr,
    players,
    totals,
    record: { wins, losses, ties },
    gamesPlayed: games.length,
    gamesFinal: final.length,
  };
}

function idOfGame(game: GameState): string {
  // GameState doesn't carry its own DB id; use a stable hash of the first
  // few at-bats + start markers. For per-player game counting this is
  // sufficient — we just need each game to be distinguishable from another.
  return `${game.away.id}:${game.home.id}:${game.history[0]?.batterId ?? ''}:${game.history.length}`;
}

