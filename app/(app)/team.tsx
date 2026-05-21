import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { useAuth } from '@/lib/auth';
import { RosterMember, TeamDetail, getRoster, getTeam, regenerateInviteCode } from '@/lib/team';
import { isSupabaseConfigured } from '@/lib/supabase';
import { colors, radius, spacing, typography } from '@/lib/theme';

export default function TeamScreen() {
  const router = useRouter();
  const { profile, leaveTeam } = useAuth();
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [roster, setRoster] = useState<RosterMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isManager = profile?.role === 'manager';
  const teamId = profile?.teamId ?? null;

  const refresh = useCallback(async () => {
    if (!teamId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [t, r] = await Promise.all([getTeam(teamId), getRoster(teamId)]);
      setTeam(t);
      setRoster(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load team');
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!profile) router.replace('/');
  }, [profile, router]);

  if (!profile) return null;

  if (!teamId) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>You're not on a team yet</Text>
          <Text style={styles.emptyBody}>
            Use an invite code from your manager on the home screen to join.
          </Text>
          <Button label="Back to home" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  async function copyCode() {
    if (!team) return;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(team.inviteCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {
        // ignore
      }
    }
  }

  async function rotateCode() {
    if (!team) return;
    setBusy(true);
    setError(null);
    try {
      const next = await regenerateInviteCode(team.id);
      setTeam({ ...team, inviteCode: next });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not rotate code');
    } finally {
      setBusy(false);
    }
  }

  async function handleLeave() {
    setBusy(true);
    setError(null);
    try {
      await leaveTeam();
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not leave team');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>TEAM</Text>
          <Text style={styles.title}>
            {team?.name ?? profile.teamName ?? 'Loading…'}
          </Text>
          {isManager ? <Text style={styles.role}>You're the manager</Text> : null}
        </View>

        {!isSupabaseConfigured ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Demo mode</Text>
            <Text style={styles.muted}>
              Connect Supabase from the home screen to invite real teammates.
            </Text>
          </View>
        ) : null}

        {isManager && team ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Invite code</Text>
            <Text style={styles.muted}>
              Share this code with players. They register, paste the code on their home
              screen, and join your roster.
            </Text>
            <View style={styles.codeBox}>
              <Text selectable style={styles.code}>
                {team.inviteCode}
              </Text>
              {Platform.OS === 'web' ? (
                <Pressable
                  onPress={copyCode}
                  style={({ pressed }) => [
                    styles.copyBtn,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Text style={styles.copyText}>{copied ? 'Copied' : 'Copy'}</Text>
                </Pressable>
              ) : (
                <Text style={styles.copyHint}>Tap & hold to copy</Text>
              )}
            </View>
            <Button
              label="Rotate code"
              variant="secondary"
              onPress={rotateCode}
              loading={busy}
            />
          </View>
        ) : null}

        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Roster</Text>
            {loading ? <ActivityIndicator color={colors.textMuted} size="small" /> : null}
          </View>
          {!loading && roster.length === 0 ? (
            <Text style={styles.muted}>
              {isManager
                ? 'Nobody has joined yet. Share the invite code above.'
                : 'No teammates yet.'}
            </Text>
          ) : (
            roster.map((member) => (
              <View key={member.id} style={styles.rosterRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rosterName}>
                    {member.displayName}
                    {member.id === profile.id ? (
                      <Text style={styles.you}> (you)</Text>
                    ) : null}
                  </Text>
                  <Text style={styles.rosterEmail}>{member.email}</Text>
                </View>
                {member.role === 'manager' ? (
                  <Text style={styles.managerTag}>Manager</Text>
                ) : null}
              </View>
            ))
          )}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          label="Season stats"
          onPress={() => router.push(`/stats/${teamId}`)}
        />

        {!isManager ? (
          <Button label="Leave team" variant="secondary" onPress={handleLeave} loading={busy} />
        ) : null}
        <Button label="Back to home" variant="ghost" onPress={() => router.back()} />
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
  role: { ...typography.body, color: colors.textMuted },
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { ...typography.h3, color: colors.text },
  muted: { ...typography.caption, color: colors.textMuted },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accent,
    padding: spacing.md,
    gap: spacing.md,
  },
  code: {
    flex: 1,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    fontSize: 22,
    color: colors.accent,
    letterSpacing: 4,
  },
  copyBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.accent,
  },
  copyText: { ...typography.label, color: colors.bg },
  copyHint: { ...typography.caption, color: colors.textMuted },
  rosterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rosterName: { ...typography.body, color: colors.text, fontWeight: '600' },
  you: { color: colors.textMuted, fontWeight: '400' },
  rosterEmail: { ...typography.caption, color: colors.textMuted },
  managerTag: {
    ...typography.caption,
    color: colors.accent,
    letterSpacing: 2,
    fontWeight: '700',
  },
  error: { ...typography.caption, color: colors.danger, textAlign: 'center' },
  empty: { flex: 1, padding: spacing.lg, gap: spacing.md, justifyContent: 'center' },
  emptyTitle: { ...typography.h2, color: colors.text, textAlign: 'center' },
  emptyBody: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
});
