import { StyleSheet, Text, View } from 'react-native';
import { GameState, awayTotal, homeTotal } from '@/lib/scoring';
import { colors, typography } from '@/lib/theme';

export function Scoreboard({ game }: { game: GameState }) {
  const inningsToShow = Math.max(game.totalInnings, game.inning, game.awayScoreByInning.length);
  const innings = Array.from({ length: inningsToShow }, (_, i) => i + 1);

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={[styles.cell, styles.teamCell]}>
          <Text style={styles.teamHeader}> </Text>
        </View>
        {innings.map((n) => (
          <View key={n} style={styles.cell}>
            <Text style={styles.colHeader}>{n}</Text>
          </View>
        ))}
        <View style={[styles.cell, styles.totalCell]}>
          <Text style={styles.colHeader}>R</Text>
        </View>
        <View style={[styles.cell, styles.totalCell]}>
          <Text style={styles.colHeader}>H</Text>
        </View>
      </View>

      <TeamRow
        label={game.away.abbreviation}
        scoresByInning={game.awayScoreByInning}
        innings={innings}
        runs={awayTotal(game)}
        hits={game.awayHits}
        active={game.status !== 'final' && game.half === 'top'}
        currentInning={game.inning}
      />

      <TeamRow
        label={game.home.abbreviation}
        scoresByInning={game.homeScoreByInning}
        innings={innings}
        runs={homeTotal(game)}
        hits={game.homeHits}
        active={game.status !== 'final' && game.half === 'bottom'}
        currentInning={game.inning}
      />
    </View>
  );
}

function TeamRow({
  label,
  scoresByInning,
  innings,
  runs,
  hits,
  active,
  currentInning,
}: {
  label: string;
  scoresByInning: number[];
  innings: number[];
  runs: number;
  hits: number;
  active: boolean;
  currentInning: number;
}) {
  return (
    <View style={styles.row}>
      <View style={[styles.cell, styles.teamCell]}>
        <Text style={[styles.teamLabel, active && styles.activeLabel]}>{label}</Text>
      </View>
      {innings.map((n) => {
        const value = scoresByInning[n - 1];
        const isActive = active && n === currentInning;
        return (
          <View key={n} style={[styles.cell, isActive && styles.activeCell]}>
            <Text style={[styles.cellText, isActive && styles.activeText]}>
              {value === undefined ? '–' : value}
            </Text>
          </View>
        );
      })}
      <View style={[styles.cell, styles.totalCell]}>
        <Text style={styles.totalText}>{runs}</Text>
      </View>
      <View style={[styles.cell, styles.totalCell]}>
        <Text style={styles.totalText}>{hits}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.bgElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  cell: {
    flex: 1,
    minWidth: 28,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamCell: { flex: 1.4, alignItems: 'flex-start', paddingLeft: 12 },
  totalCell: { backgroundColor: 'rgba(255,255,255,0.04)' },
  teamHeader: { ...typography.caption, color: colors.textMuted },
  colHeader: { ...typography.caption, color: colors.textMuted, fontWeight: '600' },
  teamLabel: { ...typography.label, color: colors.text, letterSpacing: 1 },
  activeLabel: { color: colors.accent },
  cellText: { ...typography.body, color: colors.text },
  activeCell: { backgroundColor: 'rgba(245,158,11,0.15)' },
  activeText: { color: colors.accent, fontWeight: '700' },
  totalText: { ...typography.body, color: colors.text, fontWeight: '700' },
});
