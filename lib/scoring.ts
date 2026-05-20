export type Player = { id: string; name: string; number?: number };

export type Team = {
  id: string;
  name: string;
  abbreviation: string;
  players: Player[];
};

export type PlayEvent =
  | 'single'
  | 'double'
  | 'triple'
  | 'hr'
  | 'walk'
  | 'sacrifice'
  | 'strikeout'
  | 'out';

export const PLAY_EVENTS: readonly PlayEvent[] = [
  'single',
  'double',
  'triple',
  'hr',
  'walk',
  'sacrifice',
  'strikeout',
  'out',
] as const;

export const EVENT_LABELS: Record<PlayEvent, string> = {
  single: '1B',
  double: '2B',
  triple: '3B',
  hr: 'HR',
  walk: 'BB',
  sacrifice: 'SAC',
  strikeout: 'K',
  out: 'OUT',
};

export const EVENT_FULL_LABELS: Record<PlayEvent, string> = {
  single: 'Single',
  double: 'Double',
  triple: 'Triple',
  hr: 'Home run',
  walk: 'Walk',
  sacrifice: 'Sacrifice',
  strikeout: 'Strikeout',
  out: 'Out',
};

type Bases = {
  first: string | null;
  second: string | null;
  third: string | null;
};

export type AtBatRecord = {
  inning: number;
  half: 'top' | 'bottom';
  batterId: string;
  event: PlayEvent;
  runsScored: number;
  outsRecorded: number;
};

export type GameState = {
  away: Team;
  home: Team;
  awayLineup: string[];
  homeLineup: string[];
  awayIndex: number;
  homeIndex: number;
  inning: number;
  half: 'top' | 'bottom';
  bases: Bases;
  outs: number;
  awayScoreByInning: number[];
  homeScoreByInning: number[];
  awayHits: number;
  homeHits: number;
  history: AtBatRecord[];
  past: GameState[];
  status: 'in_progress' | 'final';
  totalInnings: number;
};

export type CreateGameInput = {
  away: Team;
  home: Team;
  awayLineup?: string[];
  homeLineup?: string[];
  totalInnings?: number;
};

export function createGame({
  away,
  home,
  awayLineup,
  homeLineup,
  totalInnings = 7,
}: CreateGameInput): GameState {
  return {
    away,
    home,
    awayLineup: awayLineup ?? away.players.map((p) => p.id),
    homeLineup: homeLineup ?? home.players.map((p) => p.id),
    awayIndex: 0,
    homeIndex: 0,
    inning: 1,
    half: 'top',
    bases: { first: null, second: null, third: null },
    outs: 0,
    awayScoreByInning: [0],
    homeScoreByInning: [],
    awayHits: 0,
    homeHits: 0,
    history: [],
    past: [],
    status: 'in_progress',
    totalInnings,
  };
}

export function currentBatter(state: GameState): Player | null {
  if (state.status === 'final') return null;
  const team = state.half === 'top' ? state.away : state.home;
  const lineup = state.half === 'top' ? state.awayLineup : state.homeLineup;
  const idx = state.half === 'top' ? state.awayIndex : state.homeIndex;
  const id = lineup[idx % lineup.length];
  return team.players.find((p) => p.id === id) ?? null;
}

export function onDeckBatter(state: GameState): Player | null {
  if (state.status === 'final') return null;
  const team = state.half === 'top' ? state.away : state.home;
  const lineup = state.half === 'top' ? state.awayLineup : state.homeLineup;
  const idx = state.half === 'top' ? state.awayIndex : state.homeIndex;
  const id = lineup[(idx + 1) % lineup.length];
  return team.players.find((p) => p.id === id) ?? null;
}

export function awayTotal(state: GameState): number {
  return state.awayScoreByInning.reduce((a, b) => a + b, 0);
}

export function homeTotal(state: GameState): number {
  return state.homeScoreByInning.reduce((a, b) => a + b, 0);
}

export function applyEvent(state: GameState, event: PlayEvent): GameState {
  if (state.status === 'final') return state;

  const battingTeam = state.half === 'top' ? 'away' : 'home';
  const lineup = battingTeam === 'away' ? state.awayLineup : state.homeLineup;
  const idx = battingTeam === 'away' ? state.awayIndex : state.homeIndex;
  const batterId = lineup[idx % lineup.length];

  let bases: Bases = { ...state.bases };
  let runsScored = 0;
  let outsAdded = 0;
  let hitAdded = 0;

  switch (event) {
    case 'single':
      if (bases.third) runsScored += 1;
      bases = { first: batterId, second: bases.first, third: bases.second };
      hitAdded = 1;
      break;
    case 'double':
      if (bases.third) runsScored += 1;
      if (bases.second) runsScored += 1;
      bases = { first: null, second: batterId, third: bases.first };
      hitAdded = 1;
      break;
    case 'triple':
      runsScored +=
        (bases.first ? 1 : 0) + (bases.second ? 1 : 0) + (bases.third ? 1 : 0);
      bases = { first: null, second: null, third: batterId };
      hitAdded = 1;
      break;
    case 'hr':
      runsScored =
        1 + (bases.first ? 1 : 0) + (bases.second ? 1 : 0) + (bases.third ? 1 : 0);
      bases = { first: null, second: null, third: null };
      hitAdded = 1;
      break;
    case 'walk': {
      // Force runners only
      if (bases.first) {
        if (bases.second) {
          if (bases.third) runsScored += 1;
          bases.third = bases.second;
        }
        bases.second = bases.first;
      }
      bases.first = batterId;
      break;
    }
    case 'sacrifice':
      outsAdded = 1;
      if (bases.third) runsScored += 1;
      bases = { first: null, second: bases.first, third: bases.second };
      break;
    case 'strikeout':
    case 'out':
      outsAdded = 1;
      break;
  }

  // Build the next state piece by piece
  const inningIdx = state.inning - 1;
  const awayScoreByInning = [...state.awayScoreByInning];
  const homeScoreByInning = [...state.homeScoreByInning];

  if (battingTeam === 'away') {
    awayScoreByInning[inningIdx] = (awayScoreByInning[inningIdx] ?? 0) + runsScored;
  } else {
    homeScoreByInning[inningIdx] = (homeScoreByInning[inningIdx] ?? 0) + runsScored;
  }

  let next: GameState = {
    ...state,
    past: [...state.past, state].slice(-25),
    bases,
    outs: state.outs + outsAdded,
    awayScoreByInning,
    homeScoreByInning,
    awayHits: state.awayHits + (battingTeam === 'away' ? hitAdded : 0),
    homeHits: state.homeHits + (battingTeam === 'home' ? hitAdded : 0),
    awayIndex: battingTeam === 'away' ? state.awayIndex + 1 : state.awayIndex,
    homeIndex: battingTeam === 'home' ? state.homeIndex + 1 : state.homeIndex,
    history: [
      ...state.history,
      {
        inning: state.inning,
        half: state.half,
        batterId,
        event,
        runsScored,
        outsRecorded: outsAdded,
      },
    ],
  };

  next = advanceAfterPlay(next);
  return next;
}

function advanceAfterPlay(state: GameState): GameState {
  // Check walk-off in bottom of last (or extra) inning
  if (
    state.half === 'bottom' &&
    state.inning >= state.totalInnings &&
    homeTotal(state) > awayTotal(state)
  ) {
    return { ...state, status: 'final' };
  }

  if (state.outs < 3) return state;

  // Half-inning over: swap half / advance inning / check end of game
  const ending: GameState = {
    ...state,
    outs: 0,
    bases: { first: null, second: null, third: null },
  };

  if (ending.half === 'top') {
    // Move to bottom of same inning
    const homeScoreByInning = [...ending.homeScoreByInning];
    if (homeScoreByInning.length < ending.inning) homeScoreByInning.push(0);

    // If we're in/after the final inning and home is already winning, game over
    if (
      ending.inning >= ending.totalInnings &&
      homeTotal(ending) > awayTotal(ending)
    ) {
      return { ...ending, status: 'final', homeScoreByInning };
    }
    return { ...ending, half: 'bottom', homeScoreByInning };
  }

  // Bottom finished
  const finishedRegulation = ending.inning >= ending.totalInnings;
  const tied = awayTotal(ending) === homeTotal(ending);
  if (finishedRegulation && !tied) {
    return { ...ending, status: 'final' };
  }

  // Start a new inning, top
  const newInning = ending.inning + 1;
  const awayScoreByInning = [...ending.awayScoreByInning];
  while (awayScoreByInning.length < newInning) awayScoreByInning.push(0);
  return {
    ...ending,
    inning: newInning,
    half: 'top',
    awayScoreByInning,
  };
}

export function undo(state: GameState): GameState {
  const prev = state.past[state.past.length - 1];
  return prev ?? state;
}
