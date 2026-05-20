import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react';
import {
  CreateGameInput,
  GameState,
  PlayEvent,
  applyEvent as applyEventCore,
  createGame,
  undo as undoCore,
} from './scoring';

type GameContextValue = {
  game: GameState | null;
  startGame: (input: CreateGameInput) => void;
  applyEvent: (event: PlayEvent) => void;
  undo: () => void;
  reset: () => void;
};

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [game, setGame] = useState<GameState | null>(null);

  const startGame = useCallback((input: CreateGameInput) => {
    setGame(createGame(input));
  }, []);

  const apply = useCallback((event: PlayEvent) => {
    setGame((prev) => (prev ? applyEventCore(prev, event) : prev));
  }, []);

  const undo = useCallback(() => {
    setGame((prev) => (prev ? undoCore(prev) : prev));
  }, []);

  const reset = useCallback(() => setGame(null), []);

  return (
    <GameContext.Provider value={{ game, startGame, applyEvent: apply, undo, reset }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside GameProvider');
  return ctx;
}
