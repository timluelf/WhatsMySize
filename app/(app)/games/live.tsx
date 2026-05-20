import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { Diamond } from '@/components/Diamond';
import { PlayButtons } from '@/components/PlayButtons';
import { Scoreboard } from '@/components/Scoreboard';
import { useGame } from '@/lib/gameStore';
import {
  EVENT_FULL_LABELS,
  awayTotal,
  currentBatter,
  homeTotal,
  onDeckBatter,
} from '@/lib/scoring';
import { colors, radius, spacing, typography } from '@/lib/theme';

export default function LiveGameScreen() {
  const router = useRouter();
  const { game, applyEvent, undo, reset } = useGame();

  useEffect(() => {
    if (!game) router.replace('/games/new');
  }, [game, router]);

  if (!game) return null;

  const batter = currentBatter(game);
  const onDeck = onDeckBatter(game);
  const battingTeam = game.half === 'top' ? game.away : game.home;
  const lastPlay = game.history[game.history.length - 1];
  const lastPlayLabel = lastPlay
    ? `${EVENT_FULL_LABELS[lastPlay.event]}${lastPlay.runsScored ? ` · ${lastPlay.runsScored} R` : ''}`
    : null;

  const final = game.status === 'final';
  const awayR = awayTotal(game);
  const homeR = homeTotal(game);
  const winner =
    final
      ? awayR > homeR
        ? game.away.name
        : awayR < homeR
          ? game.home.name
          : 'Tie'
      : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Scoreboard game={game} />

        {final ? (
          <View style={styles.finalCard}>
            <Text style={styles.finalLabel}>FINAL</Text>
            <Text style={styles.finalWinner}>{winner}</Text>
            <Text style={styles.finalScore}>
              {game.away.abbreviation} {awayR} — {homeR} {game.home.abbreviation}
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.statusRow}>
              <StatusPill
                label={`${game.half === 'top' ? '▲' : '▼'} ${game.inning}`}
                hint={`${battingTeam.abbreviation} batting`}
              />
              <StatusPill label={`${game.outs}`} hint={`Out${game.outs === 1 ? '' : 's'}`} />
              <StatusPill
                label={`${awayR}-${homeR}`}
                hint="Score"
              />
            </View>

            <View style={styles.diamondCard}>
              <Diamond
                first={!!game.bases.first}
                second={!!game.bases.second}
                third={!!game.bases.third}
                size={200}
              />
            </View>

            <View style={styles.batterCard}>
              <Text style={styles.batterEyebrow}>AT BAT</Text>
              <Text style={styles.batterName}>
                {batter ? `${batter.name}` : '—'}
                {batter?.number ? <Text style={styles.batterNum}> #{batter.number}</Text> : null}
              </Text>
              <Text style={styles.onDeck}>
                On deck: {onDeck?.name ?? '—'}
              </Text>
              {lastPlayLabel ? (
                <Text style={styles.lastPlay}>Last play: {lastPlayLabel}</Text>
              ) : null}
            </View>

            <PlayButtons onPress={applyEvent} disabled={final} />

            <View style={styles.actions}>
              <Button
                label="Undo last play"
                variant="secondary"
                onPress={undo}
                style={{ flex: 1 }}
              />
            </View>
          </>
        )}

        <Button
          label={final ? 'Back to home' : 'Quit game'}
          variant="ghost"
          onPress={() => {
            reset();
            router.replace('/');
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatusPill({ label, hint }: { label: string; hint: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillLabel}>{label}</Text>
      <Text style={styles.pillHint}>{hint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, gap: spacing.lg },
  statusRow: { flexDirection: 'row', gap: spacing.sm },
  pill: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 2,
  },
  pillLabel: { ...typography.h2, color: colors.text, fontSize: 22 },
  pillHint: { ...typography.caption, color: colors.textMuted },
  diamondCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  batterCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 2,
  },
  batterEyebrow: { ...typography.caption, color: colors.accent, letterSpacing: 2 },
  batterName: { ...typography.h2, color: colors.text },
  batterNum: { color: colors.textMuted, fontWeight: '400' },
  onDeck: { ...typography.body, color: colors.textMuted },
  lastPlay: { ...typography.caption, color: colors.textMuted, marginTop: 4 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  finalCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.primary,
    padding: spacing.lg,
    alignItems: 'center',
    gap: 6,
  },
  finalLabel: { ...typography.label, color: colors.primary, letterSpacing: 4 },
  finalWinner: { ...typography.h1, color: colors.text },
  finalScore: { ...typography.body, color: colors.textMuted },
});
