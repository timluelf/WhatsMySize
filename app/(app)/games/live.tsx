import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
      <ScrollView contentContainerStyle={styles.scroll}>
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
          <>
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
          </>
        ) : (
          <>
            <View style={styles.diamondCard}>
              <Diamond
                first={!!game.bases.first}
                second={!!game.bases.second}
                third={!!game.bases.third}
                size={200}
              />
              <View style={styles.outsBox}>
                <Text style={styles.outsLabel}>Outs</Text>
                <View style={styles.outsDots}>
                  {[1, 2, 3].map((n) => (
                    <View
                      key={n}
                      style={[styles.outsDot, game.outs >= n && styles.outsDotFilled]}
                    />
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.batterCard}>
              <Text style={styles.batterEyebrow}>AT BAT</Text>
              <Text style={styles.batterName}>
                {batter ? `${batter.name}` : '—'}
                {batter?.number !== undefined ? (
                  <Text style={styles.batterNum}> #{batter.number}</Text>
                ) : null}
              </Text>
              <Text style={styles.onDeck}>On deck: {onDeck?.name ?? '—'}</Text>
              {lastPlayLabel ? (
                <Text style={styles.lastPlay}>Last play: {lastPlayLabel}</Text>
              ) : null}
            </View>

            <PlayButtons
              onPress={applyEvent}
              disabled={final}
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
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.md,
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
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
  diamondCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    alignItems: 'center',
    position: 'relative',
  },
  outsBox: {
    position: 'absolute',
    bottom: 10,
    left: 14,
    gap: 4,
  },
  outsLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  outsDots: {
    flexDirection: 'row',
    gap: 5,
  },
  outsDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border,
  },
  outsDotFilled: {
    backgroundColor: colors.primary,
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
  batterName: { ...typography.h2, color: colors.text, fontSize: 20 },
  batterNum: { color: colors.textMuted, fontWeight: '400' },
  onDeck: { ...typography.body, color: colors.textMuted, fontSize: 14 },
  lastPlay: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  undoBtn: {
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgElevated,
    marginTop: -4,
  },
  undoText: { ...typography.caption, color: colors.textMuted, fontWeight: '600' },
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
