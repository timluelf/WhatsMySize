import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
  disabledEvents,
  homeTotal,
  onDeckBatter,
} from '@/lib/scoring';
import { colors, radius, spacing, typography } from '@/lib/theme';

export default function LiveGameScreen() {
  const router = useRouter();
  const { game, applyEvent, undo, reset, syncing, syncError } = useGame();

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

  function handleQuit() {
    reset();
    router.replace('/');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            onPress={handleQuit}
            style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.7 }]}
            hitSlop={12}
          >
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
          <View style={styles.syncSlot}>
            {syncing ? <Text style={styles.syncText}>Saving…</Text> : null}
            {syncError ? <Text style={styles.syncErrorText}>{syncError}</Text> : null}
          </View>
        </View>

        <Pressable
          onPress={() => router.push('/games/box-score')}
          style={({ pressed }) => [styles.scoreboardWrap, pressed && { opacity: 0.85 }]}
        >
          <Scoreboard game={game} />
          <Text style={styles.tapHint}>Tap for box score ›</Text>
        </Pressable>

        {final ? (
          <View style={styles.finalArea}>
            <View style={styles.finalCard}>
              <Text style={styles.finalLabel}>FINAL</Text>
              <Text style={styles.finalWinner}>{winner}</Text>
              <Text style={styles.finalScore}>
                {game.away.abbreviation} {awayR} — {homeR} {game.home.abbreviation}
              </Text>
            </View>
            <Button
              label="View box score"
              onPress={() => router.push('/games/box-score')}
            />
            <Button label="Back to home" variant="ghost" onPress={handleQuit} />
          </View>
        ) : (
          <>
            <View style={styles.statusRow}>
              <View style={styles.statusBlock}>
                <View style={styles.statusItem}>
                  <Text style={styles.statusBig}>
                    {game.half === 'top' ? '▲' : '▼'} {game.inning}
                  </Text>
                  <Text style={styles.statusLabel}>
                    {battingTeam.abbreviation}
                  </Text>
                </View>
                <View style={styles.statusItem}>
                  <Text style={styles.statusBig}>{game.outs}</Text>
                  <Text style={styles.statusLabel}>
                    out{game.outs === 1 ? '' : 's'}
                  </Text>
                </View>
                <View style={styles.statusItem}>
                  <Text style={styles.statusBig}>
                    {awayR}–{homeR}
                  </Text>
                  <Text style={styles.statusLabel}>score</Text>
                </View>
              </View>
              <Diamond
                first={!!game.bases.first}
                second={!!game.bases.second}
                third={!!game.bases.third}
                size={92}
              />
            </View>

            <View style={styles.batterRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.batterEyebrow}>AT BAT</Text>
                <Text style={styles.batterName} numberOfLines={1}>
                  {batter ? batter.name : '—'}
                  {batter?.number !== undefined ? (
                    <Text style={styles.batterNum}> #{batter.number}</Text>
                  ) : null}
                </Text>
              </View>
              <View style={styles.onDeckBlock}>
                <Text style={styles.onDeckLabel}>ON DECK</Text>
                <Text style={styles.onDeckName} numberOfLines={1}>
                  {onDeck?.name ?? '—'}
                </Text>
              </View>
            </View>

            {lastPlayLabel ? (
              <Text style={styles.lastPlay} numberOfLines={1}>
                Last: {lastPlayLabel}
              </Text>
            ) : null}

            <View style={styles.actions}>
              <PlayButtons
                onPress={applyEvent}
                disabledEvents={disabledEvents(game)}
              />
              <Pressable
                onPress={undo}
                disabled={game.past.length === 0}
                style={({ pressed }) => [
                  styles.undoBtn,
                  pressed && { opacity: 0.7 },
                  game.past.length === 0 && { opacity: 0.4 },
                ]}
                hitSlop={8}
              >
                <Text style={styles.undoText}>↶ Undo last play</Text>
              </Pressable>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  closeText: { color: colors.text, fontSize: 16, lineHeight: 18 },
  syncSlot: { flex: 1, alignItems: 'flex-end', paddingHorizontal: 4 },
  syncText: { ...typography.caption, color: colors.textMuted },
  syncErrorText: { ...typography.caption, color: colors.danger },
  scoreboardWrap: { gap: 4 },
  tapHint: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'right',
    fontStyle: 'italic',
    fontSize: 11,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  statusBlock: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statusItem: { alignItems: 'center', minWidth: 56 },
  statusBig: { ...typography.h2, color: colors.text, fontSize: 22 },
  statusLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  batterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    gap: spacing.md,
  },
  batterEyebrow: {
    ...typography.caption,
    color: colors.accent,
    letterSpacing: 2,
    fontSize: 10,
  },
  batterName: { ...typography.h3, color: colors.text, fontSize: 18 },
  batterNum: { color: colors.textMuted, fontWeight: '400' },
  onDeckBlock: { alignItems: 'flex-end' },
  onDeckLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 2,
  },
  onDeckName: { ...typography.body, color: colors.text, fontSize: 14, maxWidth: 140 },
  lastPlay: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
    paddingHorizontal: 4,
  },
  actions: { marginTop: 'auto', gap: 6 },
  undoBtn: {
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgElevated,
  },
  undoText: { ...typography.caption, color: colors.textMuted, fontWeight: '600' },
  finalArea: {
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center',
  },
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
