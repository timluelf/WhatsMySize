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
import { SegmentedTabs } from '@/components/SegmentedTabs';
import { useAuth } from '@/lib/auth';
import { dollarsToCents, formatFee } from '@/lib/money';
import { startCheckout } from '@/lib/payments';
import { isSupabaseConfigured } from '@/lib/supabase';
import {
  Tournament,
  createTournament,
  findTournamentByCode,
  joinTournamentByCode,
  listTournamentsCreatedBy,
  listTournamentsForTeam,
} from '@/lib/tournaments';
import { colors, radius, spacing, typography } from '@/lib/theme';

const SIZE_OPTIONS = [
  { value: '4', label: '4 teams' },
  { value: '8', label: '8 teams' },
  { value: '16', label: '16 teams' },
] as const;

export default function TournamentsScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newSize, setNewSize] = useState<'4' | '8' | '16'>('8');
  const [newFee, setNewFee] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isManager = profile?.role === 'manager';
  const isAdmin = profile?.isAdmin ?? false;
  const teamId = profile?.teamId ?? null;

  const refresh = useCallback(async () => {
    if (!profile) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const map = new Map<string, Tournament>();
      if (teamId) {
        for (const t of await listTournamentsForTeam(teamId)) map.set(t.id, t);
      }
      if (isAdmin) {
        for (const t of await listTournamentsCreatedBy(profile.id)) map.set(t.id, t);
      }
      setTournaments(Array.from(map.values()));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load');
    } finally {
      setLoading(false);
    }
  }, [profile, teamId, isAdmin]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!profile) return null;

  if (!isSupabaseConfigured) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Tournaments need Supabase</Text>
          <Text style={styles.emptyBody}>
            Connect Supabase from the home screen to use tournaments.
          </Text>
          <Button label="Back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  async function handleJoin() {
    if (!teamId) return;
    setError(null);
    setBusy(true);
    try {
      const tournament = await findTournamentByCode(code);
      if (!tournament) {
        setError('No tournament found with that code');
        return;
      }
      if (tournament.status !== 'open') {
        setError('Tournament has already started');
        return;
      }
      if (tournament.registrationFeeCents === 0) {
        await joinTournamentByCode(code, teamId);
        setCode('');
        await refresh();
      } else {
        const returnUrl =
          Platform.OS === 'web' && typeof window !== 'undefined'
            ? `${window.location.origin}/tournaments/${tournament.id}`
            : `dartball://tournaments/${tournament.id}`;
        const url = await startCheckout({
          teamId,
          target: { kind: 'tournament', tournamentId: tournament.id },
          returnUrl,
        });
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.location.href = url;
        } else {
          setError('Open this app on the web to complete payment for now.');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join');
    } finally {
      setBusy(false);
    }
  }

  async function handleCreate() {
    if (!profile) return;
    setError(null);
    setBusy(true);
    try {
      const t = await createTournament({
        name: newName,
        description: null,
        size: parseInt(newSize, 10),
        userId: profile.id,
        registrationFeeCents: dollarsToCents(newFee),
      });
      setNewName('');
      setNewFee('');
      await refresh();
      router.push(`/tournaments/${t.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>TOURNAMENTS</Text>
          <Text style={styles.title}>Brackets</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Your tournaments</Text>
            {loading ? <ActivityIndicator color={colors.textMuted} size="small" /> : null}
          </View>
          {!loading && tournaments.length === 0 ? (
            <Text style={styles.muted}>None yet. Join or create one below.</Text>
          ) : (
            tournaments.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => router.push(`/tournaments/${t.id}`)}
                style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowName}>{t.name}</Text>
                  <Text style={styles.rowMeta}>
                    {t.size} teams · {t.status.replace('_', ' ')} ·{' '}
                    {formatFee(t.registrationFeeCents)}
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            ))
          )}
        </View>

        {isManager && teamId ? (
          <View style={[styles.card, { borderColor: colors.accent }]}>
            <Text style={styles.cardEyebrow}>JOIN A TOURNAMENT</Text>
            <Text style={styles.cardTitle}>Got a tournament code?</Text>
            <Input
              placeholder="Paste join code"
              value={code}
              onChangeText={setCode}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <Button
              label="Join tournament"
              onPress={handleJoin}
              loading={busy}
              disabled={!code.trim()}
            />
          </View>
        ) : null}

        {isAdmin ? (
          <View style={styles.card}>
            <Text style={styles.cardEyebrow}>CREATE A TOURNAMENT</Text>
            <Text style={styles.cardTitle}>Start a new bracket</Text>
            <Text style={styles.muted}>
              Pick a size. Once that many teams have joined, you can generate the bracket
              from the tournament page. Leave fee blank for free entry.
            </Text>
            <Input
              placeholder="Tournament name"
              value={newName}
              onChangeText={setNewName}
              autoCapitalize="words"
            />
            <SegmentedTabs
              value={newSize}
              onChange={(v) => setNewSize(v as '4' | '8' | '16')}
              tabs={SIZE_OPTIONS}
            />
            <Input
              label="Registration fee per team ($)"
              placeholder="e.g. 50"
              value={newFee}
              onChangeText={setNewFee}
              keyboardType="decimal-pad"
            />
            <Button
              label="Create tournament"
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowName: { ...typography.body, color: colors.text, fontWeight: '600' },
  rowMeta: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  chevron: { fontSize: 24, color: colors.textMuted, fontWeight: '300' },
  error: { ...typography.caption, color: colors.danger, textAlign: 'center' },
  empty: { flex: 1, padding: spacing.lg, gap: spacing.md, justifyContent: 'center' },
  emptyTitle: { ...typography.h2, color: colors.text, textAlign: 'center' },
  emptyBody: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
});
