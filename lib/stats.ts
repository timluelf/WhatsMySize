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
const AB_EVENTS: PlayEvent[] = ['single', 'double', 'triple', 'hr', 'strikeout', 'out'];

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
      rbi += record.runsScored;
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
