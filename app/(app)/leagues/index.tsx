import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
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
import {
  League,
  createLeague,
  findLeagueByCode,
  joinLeagueByCode,
  listLeaguesForTeam,
} from '@/lib/leagues';
import { dollarsToCents, formatFee } from '@/lib/money';
import { startCheckout } from '@/lib/payments';
import { isSupabaseConfigured } from '@/lib/supabase';
import { colors, radius, spacing, typography } from '@/lib/theme';

export default function LeaguesScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newFee, setNewFee] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isManager = profile?.role === 'manager';
  const teamId = profile?.teamId ?? null;

  const refresh = useCallback(async () => {
    if (!teamId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setLeagues(await listLeaguesForTeam(teamId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load');
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!profile) return null;

  if (!isSupabaseConfigured) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Leagues need Supabase</Text>
          <Text style={styles.emptyBody}>
            Connect a Supabase project from the home screen to use leagues.
          </Text>
          <Button label="Back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  if (!teamId) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>You need a team first</Text>
          <Text style={styles.emptyBody}>
            Create or join a team before adding it to a league.
          </Text>
          <Button label="Back to home" onPress={() => router.replace('/')} />
        </View>
      </SafeAreaView>
    );
  }

  async function handleJoin() {
    if (!teamId) return;
    setError(null);
    setBusy(true);
    try {
      const league = await findLeagueByCode(code);
      if (!league) {
        setError('No league found with that code');
        return;
      }
      if (league.registrationFeeCents === 0) {
        await joinLeagueByCode(code, teamId);
        setCode('');
        await refresh();
      } else {
        const returnUrl =
          Platform.OS === 'web' && typeof window !== 'undefined'
            ? `${window.location.origin}/leagues/${league.id}`
            : `dartball://leagues/${league.id}`;
        const url = await startCheckout({
          teamId,
          target: { kind: 'league', leagueId: league.id },
          returnUrl,
        });
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.location.href = url;
        } else {
          setError('Open this app on the web to complete payment for now.');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join league');
    } finally {
      setBusy(false);
    }
  }

  async function handleCreate() {
    if (!profile || !teamId) return;
    setError(null);
    setBusy(true);
    try {
      const league = await createLeague({
        name: newName,
        description: null,
        userId: profile.id,
        teamId,
        registrationFeeCents: dollarsToCents(newFee),
      });
      setNewName('');
      setNewFee('');
      await refresh();
      router.push(`/leagues/${league.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create league');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>LEAGUES</Text>
          <Text style={styles.title}>Your leagues</Text>
          <Text style={styles.muted}>
            {profile.teamName} is in {leagues.length}{' '}
            {leagues.length === 1 ? 'league' : 'leagues'}
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Active</Text>
            {loading ? <ActivityIndicator color={colors.textMuted} size="small" /> : null}
          </View>
          {!loading && leagues.length === 0 ? (
            <Text style={styles.muted}>Not in any leagues yet. Join or create one below.</Text>
          ) : (
            leagues.map((league) => (
              <Pressable
                key={league.id}
                onPress={() => router.push(`/leagues/${league.id}`)}
                style={({ pressed }) => [styles.leagueRow, pressed && { opacity: 0.85 }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.leagueName}>{league.name}</Text>
                  <Text style={styles.leagueDesc} numberOfLines={1}>
                    {formatFee(league.registrationFeeCents)}
                    {league.description ? ` · ${league.description}` : ''}
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            ))
          )}
        </View>

        {isManager ? (
          <View style={[styles.card, { borderColor: colors.accent }]}>
            <Text style={styles.cardEyebrow}>JOIN A LEAGUE</Text>
            <Text style={styles.cardTitle}>Got a league code?</Text>
            <Input
              placeholder="Paste join code"
              value={code}
              onChangeText={setCode}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <Button
              label="Join league"
              onPress={handleJoin}
              loading={busy}
              disabled={!code.trim()}
            />
          </View>
        ) : null}

        {isManager && profile.isAdmin ? (
          <View style={styles.card}>
            <Text style={styles.cardEyebrow}>CREATE A LEAGUE</Text>
            <Text style={styles.cardTitle}>Start a new league</Text>
            <Text style={styles.muted}>
              Your team is added automatically. Share the join code with other managers to
              add their teams. Leave fee blank for free entry.
            </Text>
            <Input
              placeholder="League name"
              value={newName}
              onChangeText={setNewName}
              autoCapitalize="words"
            />
            <Input
              label="Registration fee per team ($)"
              placeholder="e.g. 25"
              value={newFee}
              onChangeText={setNewFee}
              keyboardType="decimal-pad"
            />
            <Button
              label="Create league"
              onPress={handleCreate}
              loading={busy}
              variant="secondary"
              disabled={!newName.trim()}
            />
          </View>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button label="Back" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, gap: spacing.lg },
  header: { gap: 4, marginTop: spacing.sm },
  eyebrow: { ...typography.caption, color: colors.primary, letterSpacing: 4 },
  title: { ...typography.h1, color: colors.text },
  muted: { ...typography.caption, color: colors.textMuted },
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardEyebrow: { ...typography.caption, color: colors.accent, letterSpacing: 3 },
  cardTitle: { ...typography.h3, color: colors.text },
  leagueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  leagueName: { ...typography.body, color: colors.text, fontWeight: '600' },
  leagueDesc: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  chevron: { fontSize: 24, color: colors.textMuted, fontWeight: '300' },
  error: { ...typography.caption, color: colors.danger, textAlign: 'center' },
  empty: { flex: 1, padding: spacing.lg, gap: spacing.md, justifyContent: 'center' },
  emptyTitle: { ...typography.h2, color: colors.text, textAlign: 'center' },
  emptyBody: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
});
