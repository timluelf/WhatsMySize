import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { useAuth } from '@/lib/auth';
import { GameState } from '@/lib/scoring';
import {
  LeagueLeaders,
  LeagueStanding,
  LeaderRow,
  computeLeaders,
  computeStandings,
  fetchLeagueGames,
} from '@/lib/leagueStats';
import { LeagueWithTeams, getLeague, leaveLeague } from '@/lib/leagues';
import { isSupabaseConfigured } from '@/lib/supabase';
import { colors, radius, spacing, typography } from '@/lib/theme';

export default function LeagueDetailScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { leagueId } = useLocalSearchParams<{ leagueId: string }>();
  const [league, setLeague] = useState<LeagueWithTeams | null>(null);
  const [standings, setStandings] = useState<LeagueStanding[]>([]);
  const [leaders, setLeaders] = useState<LeagueLeaders | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!leagueId || !isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const lg = await getLeague(leagueId);
      if (!lg) {
        setError('League not found');
        return;
      }
      const teamIds = lg.teams.map((t) => t.id);
      const games: GameState[] = await fetchLeagueGames(teamIds);
      setLeague(lg);
      setStandings(computeStandings(games, lg.teams));
      setLeaders(computeLeaders(games, lg.teams));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load league');
    } finally {
      setLoading(false);
    }
  }, [leagueId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function copyCode() {
    if (!league) return;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(league.joinCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {
        // ignore
      }
    }
  }

  async function handleLeave() {
    if (!league || !profile?.teamId) return;
    setBusy(true);
    try {
      await leaveLeague(league.id, profile.teamId);
      router.replace('/leagues');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not leave');
    } finally {
      setBusy(false);
    }
  }

  if (!profile) return null;

  const isMyTeamInLeague =
    profile.teamId && league?.teams.some((t) => t.id === profile.teamId);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : league ? (
          <>
            <View style={styles.header}>
              <Text style={styles.eyebrow}>LEAGUE</Text>
              <Text style={styles.title}>{league.name}</Text>
              {league.description ? (
                <Text style={styles.muted}>{league.description}</Text>
              ) : null}
              <Text style={styles.muted}>
                {league.teams.length} {league.teams.length === 1 ? 'team' : 'teams'}
              </Text>
            </View>

            {isMyTeamInLeague ? (
              <View style={styles.card}>
                <Text style={styles.cardEyebrow}>JOIN CODE</Text>
                <View style={styles.codeBox}>
                  <Text selectable style={styles.code}>
                    {league.joinCode}
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
                  ) : null}
                </View>
              </View>
            ) : null}

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Standings</Text>
              <StandingsTable rows={standings} />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>League leaders</Text>
              {leaders ? <LeadersBlocks leaders={leaders} /> : null}
            </View>

            {isMyTeamInLeague && profile.role === 'manager' ? (
              <Button
                label="Leave league"
                variant="secondary"
                onPress={handleLeave}
                loading={busy}
              />
            ) : null}
          </>
        ) : null}

        <Button label="Back" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StandingsTable({ rows }: { rows: LeagueStanding[] }) {
  if (rows.length === 0) {
    return <Text style={styles.muted}>No teams in this league yet.</Text>;
  }
  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={[styles.cell, styles.teamCell, styles.headerText]}>Team</Text>
        <StatHeader label="W" />
        <StatHeader label="L" />
        <StatHeader label="T" />
        <StatHeader label="RF" />
        <StatHeader label="RA" />
        <StatHeader label="+/-" wide />
      </View>
      {rows.map((row) => (
        <View key={row.team.id} style={styles.dataRow}>
          <Text
            style={[styles.cell, styles.teamCell, styles.teamName]}
            numberOfLines={1}
          >
            {row.team.name}
          </Text>
          <StatCell value={row.wins} />
          <StatCell value={row.losses} />
          <StatCell value={row.ties} />
          <StatCell value={row.runsFor} />
          <StatCell value={row.runsAgainst} />
          <StatCell
            value={row.runDiff > 0 ? `+${row.runDiff}` : row.runDiff}
            wide
            highlight={row.runDiff > 0 ? 'good' : row.runDiff < 0 ? 'bad' : undefined}
          />
        </View>
      ))}
    </View>
  );
}

function LeadersBlocks({ leaders }: { leaders: LeagueLeaders }) {
  const blocks: { title: string; rows: LeaderRow[]; format: (r: LeaderRow) => string }[] = [
    {
      title: 'Batting average',
      rows: leaders.battingAvg,
      format: (r) => r.avg.toFixed(3).replace(/^0/, ''),
    },
    { title: 'Home runs', rows: leaders.homeRuns, format: (r) => String(r.hr) },
    { title: 'RBI', rows: leaders.rbi, format: (r) => String(r.rbi) },
    { title: 'Runs scored', rows: leaders.runs, format: (r) => String(r.r) },
  ];
  const anyData = blocks.some((b) => b.rows.length > 0);
  if (!anyData) {
    return <Text style={styles.muted}>No completed games in this league yet.</Text>;
  }
  return (
    <View style={{ gap: spacing.md }}>
      {blocks.map((block) =>
        block.rows.length > 0 ? (
          <View key={block.title}>
            <Text style={styles.leaderTitle}>{block.title}</Text>
            {block.rows.map((row, i) => (
              <View key={row.playerId} style={styles.leaderRow}>
                <Text style={styles.leaderRank}>{i + 1}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.leaderName} numberOfLines={1}>
                    {row.playerName}
                    {row.playerNumber !== undefined ? (
                      <Text style={styles.leaderNum}> #{row.playerNumber}</Text>
                    ) : null}
                  </Text>
                  <Text style={styles.leaderTeam} numberOfLines={1}>
                    {row.teamName}
                  </Text>
                </View>
                <Text style={styles.leaderValue}>{block.format(row)}</Text>
              </View>
            ))}
          </View>
        ) : null
      )}
    </View>
  );
}

function StatHeader({ label, wide }: { label: string; wide?: boolean }) {
  return (
    <View style={[styles.cell, styles.statCell, wide && styles.wideStat]}>
      <Text style={styles.headerText}>{label}</Text>
    </View>
  );
}

function StatCell({
  value,
  wide,
  highlight,
}: {
  value: number | string;
  wide?: boolean;
  highlight?: 'good' | 'bad';
}) {
  return (
    <View style={[styles.cell, styles.statCell, wide && styles.wideStat]}>
      <Text
        style={[
          styles.statText,
          highlight === 'good' && { color: colors.success },
          highlight === 'bad' && { color: colors.danger },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, gap: spacing.lg },
  header: { gap: 4, marginTop: spacing.sm },
  eyebrow: { ...typography.caption, color: colors.primary, letterSpacing: 4 },
  title: { ...typography.h1, color: colors.text },
  muted: { ...typography.caption, color: colors.textMuted },
  center: { paddingVertical: spacing.xl, alignItems: 'center' },
  error: { ...typography.caption, color: colors.danger, textAlign: 'center' },
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardEyebrow: { ...typography.caption, color: colors.accent, letterSpacing: 3 },
  cardTitle: { ...typography.h3, color: colors.text },
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
    fontSize: 20,
    color: colors.accent,
    letterSpacing: 3,
  },
  copyBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.accent,
  },
  copyText: { ...typography.label, color: colors.bg },
  headerRow: {
    flexDirection: 'row',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  cell: { justifyContent: 'center' },
  teamCell: { flex: 3, paddingRight: 4 },
  teamName: { ...typography.body, color: colors.text, fontWeight: '600' },
  statCell: { width: 30, alignItems: 'center' },
  wideStat: { width: 44 },
  headerText: { ...typography.caption, color: colors.textMuted, fontWeight: '700' },
  statText: { ...typography.body, color: colors.text },
  leaderTitle: {
    ...typography.label,
    color: colors.textMuted,
    letterSpacing: 2,
    marginBottom: 4,
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  leaderRank: {
    width: 18,
    ...typography.caption,
    color: colors.accent,
    fontWeight: '700',
    textAlign: 'center',
  },
  leaderName: { ...typography.body, color: colors.text },
  leaderNum: { color: colors.textMuted, fontWeight: '400' },
  leaderTeam: { ...typography.caption, color: colors.textMuted },
  leaderValue: { ...typography.h3, color: colors.text },
});
