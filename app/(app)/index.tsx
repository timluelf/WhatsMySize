import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { useAuth } from '@/lib/auth';
import { useGame } from '@/lib/gameStore';
import { StoredGameSummary, listRecentGames } from '@/lib/games';
import { isSupabaseConfigured } from '@/lib/supabase';
import { colors, radius, spacing, typography } from '@/lib/theme';

const UPCOMING_FEATURES = [
  'Roster management',
  'Schedule & results',
  'League standings',
  'Player & season stats',
] as const;

export default function HomeScreen() {
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const { game, resumeGame } = useGame();
  const [recent, setRecent] = useState<StoredGameSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const loadGames = useCallback(async () => {
    if (!isSupabaseConfigured || !profile || profile.id.startsWith('demo-')) return;
    setLoading(true);
    try {
      setRecent(await listRecentGames(profile.id));
    } catch {
      // Silent — surface elsewhere later if it matters.
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  if (!profile) return null;

  const gameInProgress = game && game.status !== 'final';

  async function handleResume(id: string) {
    await resumeGame(id);
    router.push('/games/live');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome, {profile.displayName}</Text>
          <Text style={styles.role}>
            {profile.role === 'manager' ? 'Team manager' : 'Player'}
            {profile.teamName ? ` · ${profile.teamName}` : ' · No team yet'}
          </Text>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>LIVE SCORING</Text>
          <Text style={styles.heroTitle}>
            {gameInProgress ? 'Game in progress' : 'Score a game'}
          </Text>
          <Text style={styles.heroSub}>
            {gameInProgress
              ? `${game.away.abbreviation} @ ${game.home.abbreviation} — inning ${game.inning}`
              : 'Pick two teams, tap each at-bat, the app keeps the book.'}
          </Text>
          {gameInProgress ? (
            <Button label="Resume game" onPress={() => router.push('/games/live')} />
          ) : (
            <Button label="Start a game" onPress={() => router.push('/games/new')} />
          )}
        </View>

        {!isSupabaseConfigured ? <SupabaseSetupCard /> : null}

        {isSupabaseConfigured ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Recent games</Text>
              {loading ? <ActivityIndicator color={colors.textMuted} size="small" /> : null}
            </View>
            {recent.length === 0 && !loading ? (
              <Text style={styles.empty}>No saved games yet — start one above.</Text>
            ) : (
              recent.map((g) => (
                <GameRow key={g.id} game={g} onResume={() => handleResume(g.id)} />
              ))
            )}
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Coming up</Text>
          {UPCOMING_FEATURES.map((feature) => (
            <View key={feature} style={styles.featureRow}>
              <View style={styles.bullet} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <Button label="Sign out" variant="secondary" onPress={signOut} />
      </ScrollView>
    </SafeAreaView>
  );
}

function GameRow({
  game,
  onResume,
}: {
  game: StoredGameSummary;
  onResume: () => void;
}) {
  const winLine =
    game.status === 'final'
      ? game.awayScore > game.homeScore
        ? `${game.awayAbbr} won`
        : game.awayScore < game.homeScore
          ? `${game.homeAbbr} won`
          : 'Tied'
      : `${game.half === 'top' ? '▲' : '▼'} ${game.inning}`;
  return (
    <Pressable
      onPress={onResume}
      style={({ pressed }) => [styles.gameRow, pressed && { opacity: 0.85 }]}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.gameTeams}>
          {game.awayAbbr} <Text style={styles.gameScore}>{game.awayScore}</Text>
          <Text style={styles.gameDash}> — </Text>
          <Text style={styles.gameScore}>{game.homeScore}</Text> {game.homeAbbr}
        </Text>
        <Text style={styles.gameMeta}>
          {game.status === 'final' ? 'Final' : 'In progress'} · {winLine}
        </Text>
      </View>
      <Text style={styles.gameAction}>{game.status === 'final' ? 'View' : 'Resume'}</Text>
    </Pressable>
  );
}

function SupabaseSetupCard() {
  return (
    <View style={[styles.card, { borderColor: colors.accent, borderWidth: 1 }]}>
      <Text style={[styles.cardTitle, { color: colors.accent }]}>
        Connect Supabase to save games
      </Text>
      <Text style={styles.setupBody}>
        Right now games live in memory and disappear on refresh. To persist games and use
        real accounts:
      </Text>
      <View style={styles.steps}>
        <SetupStep n={1}>Create a free project at supabase.com</SetupStep>
        <SetupStep n={2}>
          Copy <Text style={styles.code}>Project URL</Text> and{' '}
          <Text style={styles.code}>anon public key</Text> from Settings → API
        </SetupStep>
        <SetupStep n={3}>
          Add them to <Text style={styles.code}>.env</Text> in the project:
          {'\n'}
          <Text style={styles.code}>EXPO_PUBLIC_SUPABASE_URL=…</Text>
          {'\n'}
          <Text style={styles.code}>EXPO_PUBLIC_SUPABASE_ANON_KEY=…</Text>
        </SetupStep>
        <SetupStep n={4}>
          In Supabase SQL editor, paste{' '}
          <Text style={styles.code}>supabase/migrations/0001_init.sql</Text> and{' '}
          <Text style={styles.code}>0002_games.sql</Text>
        </SetupStep>
        <SetupStep n={5}>
          Stop and re-run <Text style={styles.code}>npm run web</Text>
        </SetupStep>
      </View>
    </View>
  );
}

function SetupStep({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <View style={styles.step}>
      <View style={styles.stepNum}>
        <Text style={styles.stepNumText}>{n}</Text>
      </View>
      <Text style={styles.stepBody}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, gap: spacing.xl },
  header: { gap: spacing.xs, marginTop: spacing.lg },
  greeting: { ...typography.h1, color: colors.text },
  role: { ...typography.body, color: colors.textMuted },
  heroCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  heroEyebrow: { ...typography.caption, color: colors.primary, letterSpacing: 3 },
  heroTitle: { ...typography.h2, color: colors.text },
  heroSub: { ...typography.body, color: colors.textMuted, marginBottom: spacing.sm },
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { ...typography.h3, color: colors.text },
  empty: { ...typography.caption, color: colors.textMuted, fontStyle: 'italic' },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  bullet: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  featureText: { ...typography.body, color: colors.text },
  gameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  gameTeams: { ...typography.body, color: colors.text, fontWeight: '600' },
  gameScore: { color: colors.text, fontWeight: '700' },
  gameDash: { color: colors.textMuted, fontWeight: '400' },
  gameMeta: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  gameAction: { ...typography.label, color: colors.primary, letterSpacing: 1 },
  setupBody: { ...typography.body, color: colors.textMuted },
  steps: { gap: spacing.sm, marginTop: 4 },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumText: { ...typography.caption, color: colors.bg, fontWeight: '700' },
  stepBody: { flex: 1, ...typography.body, color: colors.text, lineHeight: 22 },
  code: {
    fontFamily: 'monospace',
    color: colors.accent,
    fontSize: 14,
  },
});
