import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useAuth } from './auth';
import {
  createGameRecord,
  loadGameRecord,
  saveGameRecord,
} from './games';
import {
  CreateGameInput,
  GameState,
  PlayEvent,
  applyEvent as applyEventCore,
  createGame,
  undo as undoCore,
} from './scoring';
import { isSupabaseConfigured } from './supabase';

type GameContextValue = {
  game: GameState | null;
  gameId: string | null;
  syncing: boolean;
  syncError: string | null;
  startGame: (input: CreateGameInput) => Promise<void>;
  resumeGame: (id: string) => Promise<void>;
  applyEvent: (event: PlayEvent) => void;
  undo: () => void;
  reset: () => void;
};

const GameContext = createContext<GameContextValue | null>(null);
const SAVE_DEBOUNCE_MS = 600;

export function GameProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [game, setGame] = useState<GameState | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const pendingSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestStateRef = useRef<GameState | null>(null);
  const latestIdRef = useRef<string | null>(null);

  latestStateRef.current = game;
  latestIdRef.current = gameId;

  const flushSave = useCallback(async () => {
    const id = latestIdRef.current;
    const state = latestStateRef.current;
    if (!id || !state || !isSupabaseConfigured) return;
    setSyncing(true);
    setSyncError(null);
    try {
      await saveGameRecord(id, state);
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setSyncing(false);
    }
  }, []);

  const scheduleSave = useCallback(() => {
    if (!isSupabaseConfigured) return;
    if (pendingSaveTimer.current) clearTimeout(pendingSaveTimer.current);
    pendingSaveTimer.current = setTimeout(flushSave, SAVE_DEBOUNCE_MS);
  }, [flushSave]);

  useEffect(() => {
    return () => {
      if (pendingSaveTimer.current) clearTimeout(pendingSaveTimer.current);
    };
  }, []);

  const startGame = useCallback(
    async (input: CreateGameInput) => {
      const fresh = createGame(input);
      setGame(fresh);
      setSyncError(null);
      setGameId(null);
      if (isSupabaseConfigured && profile && !profile.id.startsWith('demo-')) {
        setSyncing(true);
        try {
          const id = await createGameRecord(fresh, profile.id);
          setGameId(id);
        } catch (err) {
          setSyncError(err instanceof Error ? err.message : 'Could not create game');
        } finally {
          setSyncing(false);
        }
      }
    },
    [profile]
  );

  const resumeGame = useCallback(async (id: string) => {
    if (!isSupabaseConfigured) return;
    setSyncing(true);
    setSyncError(null);
    try {
      const state = await loadGameRecord(id);
      if (state) {
        setGame(state);
        setGameId(id);
      } else {
        setSyncError('Game not found');
      }
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Could not load game');
    } finally {
      setSyncing(false);
    }
  }, []);

  const apply = useCallback(
    (event: PlayEvent) => {
      setGame((prev) => (prev ? applyEventCore(prev, event) : prev));
      scheduleSave();
    },
    [scheduleSave]
  );

  const undo = useCallback(() => {
    setGame((prev) => (prev ? undoCore(prev) : prev));
    scheduleSave();
  }, [scheduleSave]);

  const reset = useCallback(() => {
    if (pendingSaveTimer.current) {
      clearTimeout(pendingSaveTimer.current);
      pendingSaveTimer.current = null;
    }
    setGame(null);
    setGameId(null);
    setSyncError(null);
  }, []);

  return (
    <GameContext.Provider
      value={{
        game,
        gameId,
        syncing,
        syncError,
        startGame,
        resumeGame,
        applyEvent: apply,
        undo,
        reset,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside GameProvider');
  return ctx;
}
