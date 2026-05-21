import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useAuth } from '@/lib/auth';
import { useGame } from '@/lib/gameStore';
import { StoredGameSummary, listRecentGames } from '@/lib/games';
import { isSupabaseConfigured } from '@/lib/supabase';
import {
  UpcomingMatch,
  listUpcomingMatchesForTeam,
} from '@/lib/tournaments';
import { colors, radius, spacing, typography } from '@/lib/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { profile, signOut, joinTeam, createTeam } = useAuth();
  const { game, resumeGame } = useGame();
  const [recent, setRecent] = useState<StoredGameSummary[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingMatch[]>([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const isAdmin = profile?.isAdmin ?? false;
  const teamId = profile?.teamId ?? null;

  const loadData = useCallback(async () => {
    if (!isSupabaseConfigured || !profile || profile.id.startsWith('demo-')) return;
    setLoadingGames(true);
    try {
      const [games, ups] = await Promise.all([
        listRecentGames(profile.id),
        teamId ? listUpcomingMatchesForTeam(teamId) : Promise.resolve([]),
      ]);
      setRecent(games);
      setUpcoming(ups);
    } catch {
      // Silent — surface elsewhere later if it matters.
    } finally {
      setLoadingGames(false);
    }
  }, [profile, teamId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!profile) return null;

  const gameInProgress = game && game.status !== 'final';
  const onATeam = !!profile.teamId;

  async function handleResume(id: string) {
    await resumeGame(id);
    router.push('/games/live');
  }

  async function handleJoin() {
    setJoinError(null);
    setJoining(true);
    try {
      await joinTeam(joinCode);
      setJoinCode('');
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Could not join team');
    } finally {
      setJoining(false);
    }
  }

  async function handleCreateTeam() {
    setCreateError(null);
    setCreatingTeam(true);
    try {
      await createTeam(newTeamName);
      setNewTeamName('');
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Could not create team');
    } finally {
      setCreatingTeam(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome, {profile.displayName}</Text>
          <Text style={styles.role}>
            {profile.role === 'manager' ? 'Team manager' : 'Player'}
            {profile.teamName ? ` · ${profile.teamName}` : ' · No team yet'}
            {isAdmin ? ' · Admin' : ''}
          </Text>
        </View>

        {isAdmin ? (
          <View style={styles.heroCard}>
            <Text style={styles.heroEyebrow}>LIVE SCORING</Text>
            <Text style={styles.heroTitle}>
              {gameInProgress ? 'Game in progress' : 'Score a game'}
            </Text>
            <Text style={styles.heroSub}>
              {gameInProgress
                ? `${game.away.abbreviation} @ ${game.home.abbreviation} — inning ${game.inning}`
                : 'Open a tournament match or seed-team practice game.'}
            </Text>
            {gameInProgress ? (
              <Button label="Resume game" onPress={() => router.push('/games/live')} />
            ) : (
              <Button label="Start a game" onPress={() => router.push('/games/new')} />
            )}
          </View>
        ) : gameInProgress ? (
          <View style={styles.heroCard}>
            <Text style={styles.heroEyebrow}>LIVE SCORING</Text>
            <Text style={styles.heroTitle}>Game in progress</Text>
            <Text style={styles.heroSub}>
              {`${game.away.abbreviation} @ ${game.home.abbreviation} — inning ${game.inning}`}
            </Text>
            <Button label="Resume game" onPress={() => router.push('/games/live')} />
          </View>
        ) : null}

        {onATeam ? (
          <Pressable
            onPress={() => router.push('/team')}
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
          >
            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardEyebrow}>YOUR TEAM</Text>
                <Text style={styles.cardTitle}>{profile.teamName}</Text>
                <Text style={styles.muted}>
                  {profile.role === 'manager'
                    ? 'Tap to view invite code and roster'
                    : 'Tap to view roster'}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </View>
          </Pressable>
        ) : profile.role === 'manager' ? (
          <View style={[styles.card, { borderColor: colors.accent }]}>
            <Text style={styles.cardEyebrow}>CREATE YOUR TEAM</Text>
            <Text style={styles.cardTitle}>You're a manager without a team</Text>
            <Text style={styles.muted}>
              Every manager runs a team. Give yours a name and we'll generate an
              invite code you can share with your roster.
            </Text>
            <Input
              placeholder="e.g. Dewey Decimals"
              value={newTeamName}
              onChangeText={setNewTeamName}
              autoCapitalize="words"
            />
            {createError ? <Text style={styles.error}>{createError}</Text> : null}
            <Button
              label="Create team"
              onPress={handleCreateTeam}
              loading={creatingTeam}
              disabled={!newTeamName.trim()}
            />
          </View>
        ) : (
          <View style={[styles.card, { borderColor: colors.accent }]}>
            <Text style={styles.cardEyebrow}>JOIN A TEAM</Text>
            <Text style={styles.cardTitle}>Got an invite code?</Text>
            <Text style={styles.muted}>
              Paste the code your manager sent you to join their roster.
            </Text>
            <Input
              placeholder="ABCD2345"
              value={joinCode}
              onChangeText={setJoinCode}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            {joinError ? <Text style={styles.error}>{joinError}</Text> : null}
            <Button
              label="Join team"
              onPress={handleJoin}
              loading={joining}
              disabled={!joinCode.trim()}
            />
          </View>
        )}

        {!isSupabaseConfigured ? <SupabaseSetupCard /> : null}

        {onATeam && isSupabaseConfigured ? (
          <View style={styles.actionRow}>
            <Button
              label="Tournaments"
              variant="secondary"
              onPress={() => router.push('/tournaments')}
              style={{ flex: 1 }}
            />
            <Button
              label="Leagues"
              variant="secondary"
              onPress={() => router.push('/leagues')}
              style={{ flex: 1 }}
            />
          </View>
        ) : null}

        {isSupabaseConfigured && upcoming.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Upcoming schedule</Text>
            {upcoming.map((u) => (
              <Pressable
                key={u.matchId}
                onPress={() => router.push(`/tournaments/${u.tournamentId}`)}
                style={({ pressed }) => [styles.gameRow, pressed && { opacity: 0.85 }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.gameTeams}>
                    {u.teamAName} <Text style={styles.gameDash}>vs</Text> {u.teamBName}
                  </Text>
                  <Text style={styles.gameMeta}>
                    {u.tournamentName} · Round {u.round}
                  </Text>
                </View>
                <Text style={styles.gameAction}>View</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {isSupabaseConfigured ? (
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>Recent games</Text>
              {loadingGames ? <ActivityIndicator color={colors.textMuted} size="small" /> : null}
            </View>
            {recent.length === 0 && !loadingGames ? (
              <Text style={styles.empty}>No saved games yet.</Text>
            ) : (
              recent.map((g) => (
                <GameRow key={g.id} game={g} onResume={() => handleResume(g.id)} />
              ))
            )}
          </View>
        ) : null}

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
          Apply each SQL file in <Text style={styles.code}>supabase/migrations/</Text>
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
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cardEyebrow: { ...typography.caption, color: colors.accent, letterSpacing: 3 },
  cardTitle: { ...typography.h3, color: colors.text },
  muted: { ...typography.caption, color: colors.textMuted },
  chevron: { fontSize: 28, color: colors.textMuted, fontWeight: '300' },
  error: { ...typography.caption, color: colors.danger },
  empty: { ...typography.caption, color: colors.textMuted, fontStyle: 'italic' },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
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
