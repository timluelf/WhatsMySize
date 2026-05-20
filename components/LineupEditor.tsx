import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Player, Team } from '@/lib/scoring';
import { colors, radius, spacing, typography } from '@/lib/theme';

type Props = {
  team: Team;
  lineup: string[];
  onChange: (next: string[]) => void;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  title: string;
};

export function LineupEditor({
  team,
  lineup,
  onChange,
  collapsed,
  onToggleCollapsed,
  title,
}: Props) {
  const orderedPlayers = lineup
    .map((id) => team.players.find((p) => p.id === id))
    .filter((p): p is Player => Boolean(p));
  const bench = team.players.filter((p) => !lineup.includes(p.id));

  function moveUp(index: number) {
    if (index <= 0) return;
    const next = [...lineup];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onChange(next);
  }

  function moveDown(index: number) {
    if (index >= lineup.length - 1) return;
    const next = [...lineup];
    [next[index + 1], next[index]] = [next[index], next[index + 1]];
    onChange(next);
  }

  function benchPlayer(id: string) {
    onChange(lineup.filter((x) => x !== id));
  }

  function addToLineup(id: string) {
    onChange([...lineup, id]);
  }

  return (
    <View style={styles.card}>
      <Pressable onPress={onToggleCollapsed} style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>{title}</Text>
          <Text style={styles.teamName}>{team.name}</Text>
          <Text style={styles.summary}>
            {orderedPlayers.length} batting · {bench.length} on bench
          </Text>
        </View>
        {onToggleCollapsed ? (
          <Text style={styles.chevron}>{collapsed ? '▾' : '▴'}</Text>
        ) : null}
      </Pressable>

      {collapsed ? null : (
        <View style={styles.body}>
          <Text style={styles.sectionLabel}>Batting order</Text>
          {orderedPlayers.length === 0 ? (
            <Text style={styles.empty}>No batters yet — add players from the bench.</Text>
          ) : (
            orderedPlayers.map((player, idx) => (
              <View key={player.id} style={styles.row}>
                <Text style={styles.orderNum}>{idx + 1}</Text>
                <View style={styles.playerInfo}>
                  <Text style={styles.playerName}>{player.name}</Text>
                  {player.number !== undefined ? (
                    <Text style={styles.playerNum}>#{player.number}</Text>
                  ) : null}
                </View>
                <View style={styles.controls}>
                  <ArrowBtn
                    label="↑"
                    onPress={() => moveUp(idx)}
                    disabled={idx === 0}
                  />
                  <ArrowBtn
                    label="↓"
                    onPress={() => moveDown(idx)}
                    disabled={idx === orderedPlayers.length - 1}
                  />
                  <Pressable
                    onPress={() => benchPlayer(player.id)}
                    style={({ pressed }) => [
                      styles.benchBtn,
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Text style={styles.benchBtnText}>Bench</Text>
                  </Pressable>
                </View>
              </View>
            ))
          )}

          {bench.length > 0 ? (
            <>
              <Text style={[styles.sectionLabel, { marginTop: spacing.md }]}>Bench</Text>
              {bench.map((player) => (
                <View key={player.id} style={styles.row}>
                  <Text style={[styles.orderNum, styles.benchOrder]}>·</Text>
                  <View style={styles.playerInfo}>
                    <Text style={[styles.playerName, styles.benchName]}>
                      {player.name}
                    </Text>
                    {player.number !== undefined ? (
                      <Text style={styles.playerNum}>#{player.number}</Text>
                    ) : null}
                  </View>
                  <Pressable
                    onPress={() => addToLineup(player.id)}
                    style={({ pressed }) => [
                      styles.addBtn,
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    <Text style={styles.addBtnText}>Add</Text>
                  </Pressable>
                </View>
              ))}
            </>
          ) : null}
        </View>
      )}
    </View>
  );
}

function ArrowBtn({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.arrow,
        pressed && !disabled && { opacity: 0.7 },
        disabled && { opacity: 0.3 },
      ]}
    >
      <Text style={styles.arrowText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  header: {
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  eyebrow: { ...typography.caption, color: colors.textMuted, letterSpacing: 2 },
  teamName: { ...typography.h3, color: colors.text },
  summary: { ...typography.caption, color: colors.textMuted },
  chevron: { ...typography.h2, color: colors.textMuted },
  body: {
    padding: spacing.md,
    paddingTop: 0,
    gap: 6,
  },
  sectionLabel: { ...typography.label, color: colors.textMuted, marginBottom: 4 },
  empty: { ...typography.caption, color: colors.textMuted, fontStyle: 'italic' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  orderNum: {
    ...typography.label,
    color: colors.accent,
    width: 22,
    textAlign: 'center',
  },
  benchOrder: { color: colors.textMuted },
  playerInfo: { flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  playerName: { ...typography.body, color: colors.text },
  benchName: { color: colors.textMuted },
  playerNum: { ...typography.caption, color: colors.textMuted },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  arrow: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: { color: colors.text, fontSize: 16 },
  benchBtn: {
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  benchBtnText: { ...typography.caption, color: colors.textMuted, fontWeight: '600' },
  addBtn: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { ...typography.caption, color: colors.text, fontWeight: '700' },
});
