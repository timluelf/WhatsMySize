import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { listGamesForTeam } from '@/lib/games';
import { isSupabaseConfigured } from '@/lib/supabase';
import { GameState } from '@/lib/scoring';
import {
  SeasonPlayerStats,
  TeamSeasonStats,
  computeSeasonStats,
  formatAvg,
} from '@/lib/stats';
import { colors, radius, spacing, typography } from '@/lib/theme';

export default function SeasonStatsScreen() {
  const router = useRouter();
  const { teamId } = useLocalSearchParams<{ teamId: string }>();
  const [games, setGames] = useState<GameState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!teamId) {
        setLoading(false);
        return;
      }
      if (!isSupabaseConfigured) {
        setError('Connect Supabase to see season stats.');
        setLoading(false);
        return;
      }
      try {
        const data = await listGamesForTeam(teamId);
        if (active) setGames(data);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Could not load');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [teamId]);

  const stats: TeamSeasonStats | null = teamId
    ? computeSeasonStats(games, teamId)
    : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>SEASON STATS</Text>
          <Text style={styles.title}>{stats?.teamName || 'Team'}</Text>
          {stats ? (
            <Text style={styles.record}>
              {stats.record.wins}-{stats.record.losses}
              {stats.record.ties ? `-${stats.record.ties}` : ''} ·{' '}
              {stats.gamesFinal} {stats.gamesFinal === 1 ? 'game' : 'games'}
            </Text>
          ) : null}
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : stats && stats.gamesFinal === 0 ? (
          <View style={styles.card}>
            <Text style={styles.empty}>
              No completed games yet for this team. Play one and finalize it to start
              filling out stats.
            </Text>
          </View>
        ) : stats ? (
          <View style={styles.tableWrap}>
            <View style={styles.headerRow}>
              <Text style={[styles.cell, styles.nameCell, styles.headerText]}>
                Batter
              </Text>
              <StatHeader label="G" />
              <StatHeader label="AB" />
              <StatHeader label="R" />
              <StatHeader label="H" />
              <StatHeader label="RBI" />
              <StatHeader label="BB" />
              <StatHeader label="K" />
              <StatHeader label="HR" />
              <StatHeader label="AVG" wide />
            </View>

            {stats.players.map((line) => (
              <PlayerRow key={line.player.id} line={line} />
            ))}

            <View style={[styles.row, styles.totalsRow]}>
              <Text style={[styles.cell, styles.nameCell, styles.totalsText]}>
                Totals
              </Text>
              <StatCell value={'–'} />
              <StatCell value={stats.totals.ab} bold />
              <StatCell value={stats.totals.r} bold />
              <StatCell value={stats.totals.h} bold />
              <StatCell value={stats.totals.rbi} bold />
              <StatCell value={stats.totals.bb} bold />
              <StatCell value={stats.totals.k} bold />
              <StatCell value={stats.totals.hrs} bold />
              <StatCell
                value={formatAvg(stats.totals.h, stats.totals.ab)}
                bold
                wide
              />
            </View>

            {extrasLine(stats) ? (
              <Text style={styles.extras}>{extrasLine(stats)}</Text>
            ) : null}
          </View>
        ) : null}

        <Button label="Back" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </SafeAreaView>
  );
}

function PlayerRow({ line }: { line: SeasonPlayerStats }) {
  return (
    <View style={styles.row}>
      <View style={[styles.cell, styles.nameCell]}>
        <Text style={styles.batterName} numberOfLines={1}>
          {line.player.name}
        </Text>
        {line.player.number !== undefined ? (
          <Text style={styles.batterNum}>#{line.player.number}</Text>
        ) : null}
      </View>
      <StatCell value={line.games} />
      <StatCell value={line.ab} />
      <StatCell value={line.r} />
      <StatCell value={line.h} />
      <StatCell value={line.rbi} />
      <StatCell value={line.bb} />
      <StatCell value={line.k} />
      <StatCell value={line.hrs} />
      <StatCell value={formatAvg(line.h, line.ab)} wide />
    </View>
  );
}

function StatHeader({ label, wide }: { label: string; wide?: boolean }) {
  return (
    <View style={[styles.cell, styles.statCell, wide && styles.wideCell]}>
      <Text style={styles.headerText}>{label}</Text>
    </View>
  );
}

function StatCell({
  value,
  bold,
  wide,
}: {
  value: number | string;
  bold?: boolean;
  wide?: boolean;
}) {
  return (
    <View style={[styles.cell, styles.statCell, wide && styles.wideCell]}>
      <Text style={[styles.statText, bold && styles.boldText]}>{value}</Text>
    </View>
  );
}

function extrasLine(stats: TeamSeasonStats): string | null {
  const parts: string[] = [];
  if (stats.totals.doubles) parts.push(`2B: ${stats.totals.doubles}`);
  if (stats.totals.triples) parts.push(`3B: ${stats.totals.triples}`);
  return parts.length ? parts.join(' · ') : null;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, gap: spacing.lg },
  header: { gap: 4, marginTop: spacing.sm },
  eyebrow: { ...typography.caption, color: colors.primary, letterSpacing: 4 },
  title: { ...typography.h1, color: colors.text },
  record: { ...typography.body, color: colors.textMuted },
  center: { paddingVertical: spacing.xl, alignItems: 'center' },
  error: { ...typography.caption, color: colors.danger, textAlign: 'center' },
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  empty: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
  tableWrap: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 2,
  },
  headerRow: {
    flexDirection: 'row',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  totalsRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderBottomWidth: 0,
    marginTop: 4,
    paddingTop: 8,
  },
  cell: { justifyContent: 'center' },
  nameCell: { flex: 3, gap: 2, paddingRight: 4 },
  statCell: { width: 26, alignItems: 'center' },
  wideCell: { width: 42 },
  headerText: { ...typography.caption, color: colors.textMuted, fontWeight: '700' },
  batterName: { ...typography.caption, color: colors.text, fontWeight: '600', fontSize: 14 },
  batterNum: { ...typography.caption, color: colors.textMuted, fontSize: 11 },
  statText: { ...typography.caption, color: colors.text, fontSize: 14 },
  boldText: { fontWeight: '700' },
  totalsText: { ...typography.caption, color: colors.text, fontWeight: '700' },
  extras: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
});
