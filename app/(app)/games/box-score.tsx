import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { Scoreboard } from '@/components/Scoreboard';
import { useGame } from '@/lib/gameStore';
import { awayTotal, homeTotal } from '@/lib/scoring';
import { PlayerLine, TeamBoxScore, computeTeamBoxScore, formatAvg } from '@/lib/stats';
import { colors, radius, spacing, typography } from '@/lib/theme';

export default function BoxScoreScreen() {
  const router = useRouter();
  const { game } = useGame();

  useEffect(() => {
    if (!game) router.replace('/');
  }, [game, router]);

  if (!game) return null;

  const away = computeTeamBoxScore(game, 'away');
  const home = computeTeamBoxScore(game, 'home');
  const final = game.status === 'final';
  const awayR = awayTotal(game);
  const homeR = homeTotal(game);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>{final ? 'FINAL' : 'BOX SCORE'}</Text>
          <Text style={styles.title}>
            {game.away.abbreviation} {awayR} — {homeR} {game.home.abbreviation}
          </Text>
        </View>

        <Scoreboard game={game} />

        <BoxScoreTable box={away} />
        <BoxScoreTable box={home} />

        <Button
          label={final ? 'Back to home' : 'Back to game'}
          onPress={() => router.back()}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function BoxScoreTable({ box }: { box: TeamBoxScore }) {
  const benchLines = box.lines.filter((l) => !l.inLineup && hasActivity(l));
  const lineupLines = box.lines.filter((l) => l.inLineup);

  return (
    <View style={styles.tableWrap}>
      <Text style={styles.tableTitle}>{box.team.name}</Text>

      <View style={styles.headerRow}>
        <Text style={[styles.cell, styles.nameCell, styles.headerText]}>Batter</Text>
        <StatHeader label="AB" />
        <StatHeader label="R" />
        <StatHeader label="H" />
        <StatHeader label="RBI" />
        <StatHeader label="BB" />
        <StatHeader label="K" />
        <StatHeader label="AVG" wide />
      </View>

      {lineupLines.map((line) => (
        <BatterRow key={line.player.id} line={line} />
      ))}

      <View style={[styles.row, styles.totalsRow]}>
        <Text style={[styles.cell, styles.nameCell, styles.totalsText]}>Totals</Text>
        <StatCell value={box.totals.ab} bold />
        <StatCell value={box.totals.r} bold />
        <StatCell value={box.totals.h} bold />
        <StatCell value={box.totals.rbi} bold />
        <StatCell value={box.totals.bb} bold />
        <StatCell value={box.totals.k} bold />
        <StatCell value={formatAvg(box.totals.h, box.totals.ab)} bold wide />
      </View>

      {benchLines.length > 0 ? (
        <>
          <Text style={styles.benchLabel}>BENCH (entered mid-game)</Text>
          {benchLines.map((line) => (
            <BatterRow key={line.player.id} line={line} />
          ))}
        </>
      ) : null}

      {summarize(box) ? (
        <Text style={styles.summary}>{summarize(box)}</Text>
      ) : null}
    </View>
  );
}

function BatterRow({ line }: { line: PlayerLine }) {
  return (
    <View style={styles.row}>
      <View style={[styles.cell, styles.nameCell]}>
        <Text style={styles.batterName} numberOfLines={1}>
          {line.battingOrder ? `${line.battingOrder}. ` : ''}
          {line.player.name}
        </Text>
        {line.player.number !== undefined ? (
          <Text style={styles.batterNum}>#{line.player.number}</Text>
        ) : null}
      </View>
      <StatCell value={line.ab} />
      <StatCell value={line.r} />
      <StatCell value={line.h} />
      <StatCell value={line.rbi} />
      <StatCell value={line.bb} />
      <StatCell value={line.k} />
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

function hasActivity(line: PlayerLine): boolean {
  return line.ab + line.bb + line.r + line.rbi > 0;
}

function summarize(box: TeamBoxScore): string | null {
  const extras: string[] = [];
  if (box.totals.doubles) extras.push(`2B: ${box.totals.doubles}`);
  if (box.totals.triples) extras.push(`3B: ${box.totals.triples}`);
  if (box.totals.hrs) extras.push(`HR: ${box.totals.hrs}`);
  return extras.length ? extras.join(' · ') : null;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, gap: spacing.lg },
  header: { alignItems: 'center', gap: 4, marginTop: spacing.sm },
  eyebrow: { ...typography.caption, color: colors.primary, letterSpacing: 4 },
  title: { ...typography.h1, color: colors.text },
  tableWrap: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 2,
  },
  tableTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
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
  statCell: { width: 28, alignItems: 'center' },
  wideCell: { width: 44 },
  headerText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '700',
  },
  batterName: { ...typography.caption, color: colors.text, fontWeight: '600', fontSize: 14 },
  batterNum: { ...typography.caption, color: colors.textMuted, fontSize: 11 },
  statText: { ...typography.caption, color: colors.text, fontSize: 14 },
  boldText: { fontWeight: '700' },
  totalsText: { ...typography.caption, color: colors.text, fontWeight: '700' },
  benchLabel: {
    ...typography.caption,
    color: colors.textMuted,
    letterSpacing: 2,
    marginTop: spacing.md,
    marginBottom: 4,
  },
  summary: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
});
