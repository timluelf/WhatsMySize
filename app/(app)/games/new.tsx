import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { useGame } from '@/lib/gameStore';
import { SEED_TEAMS } from '@/lib/seed';
import { Team } from '@/lib/scoring';
import { colors, radius, spacing, typography } from '@/lib/theme';

export default function NewGameScreen() {
  const router = useRouter();
  const { startGame } = useGame();
  const [awayId, setAwayId] = useState(SEED_TEAMS[0].id);
  const [homeId, setHomeId] = useState(SEED_TEAMS[1].id);

  const away = useMemo(() => SEED_TEAMS.find((t) => t.id === awayId)!, [awayId]);
  const home = useMemo(() => SEED_TEAMS.find((t) => t.id === homeId)!, [homeId]);

  const sameTeam = awayId === homeId;

  function start() {
    if (sameTeam) return;
    startGame({ away, home, totalInnings: 7 });
    router.replace('/games/live');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>New game</Text>
          <Text style={styles.subtitle}>
            Choose the visiting and home teams. Lineups default to roster order — you
            can rearrange in a later version.
          </Text>
        </View>

        <TeamPicker label="Visiting team" selectedId={awayId} onSelect={setAwayId} />
        <TeamPicker label="Home team" selectedId={homeId} onSelect={setHomeId} />

        <View style={styles.preview}>
          <Text style={styles.previewTitle}>Matchup</Text>
          <Text style={styles.previewMatch}>
            {away.name} <Text style={styles.at}>@</Text> {home.name}
          </Text>
          <Text style={styles.previewMeta}>7 innings · Score by tapping each at-bat</Text>
        </View>

        {sameTeam ? (
          <Text style={styles.error}>Pick two different teams to start.</Text>
        ) : null}

        <Button label="Play ball" onPress={start} disabled={sameTeam} />
        <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </SafeAreaView>
  );
}

function TeamPicker({
  label,
  selectedId,
  onSelect,
}: {
  label: string;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {SEED_TEAMS.map((team) => (
        <TeamRow
          key={team.id}
          team={team}
          selected={team.id === selectedId}
          onPress={() => onSelect(team.id)}
        />
      ))}
    </View>
  );
}

function TeamRow({
  team,
  selected,
  onPress,
}: {
  team: Team;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.teamCard,
        selected && styles.teamCardSelected,
        pressed && { opacity: 0.85 },
      ]}
    >
      <View style={styles.teamRow}>
        <Text style={styles.teamName}>{team.name}</Text>
        <Text style={styles.teamAbbr}>{team.abbreviation}</Text>
      </View>
      <Text style={styles.teamRoster}>{team.players.length} players</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, gap: spacing.lg },
  header: { gap: spacing.xs, marginTop: spacing.sm },
  title: { ...typography.h1, color: colors.text },
  subtitle: { ...typography.body, color: colors.textMuted },
  section: { gap: spacing.sm },
  sectionLabel: { ...typography.label, color: colors.textMuted },
  teamCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 2,
  },
  teamCardSelected: { borderColor: colors.primary, borderWidth: 2 },
  teamRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  teamName: { ...typography.h3, color: colors.text },
  teamAbbr: { ...typography.label, color: colors.textMuted, letterSpacing: 2 },
  teamRoster: { ...typography.caption, color: colors.textMuted },
  preview: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
    alignItems: 'center',
  },
  previewTitle: { ...typography.label, color: colors.textMuted, letterSpacing: 2 },
  previewMatch: { ...typography.h2, color: colors.text, textAlign: 'center' },
  at: { color: colors.textMuted },
  previewMeta: { ...typography.caption, color: colors.textMuted },
  error: { ...typography.caption, color: colors.danger, textAlign: 'center' },
});
