import { Pressable, StyleSheet, Text, View } from 'react-native';
import { EVENT_LABELS, EVENT_FULL_LABELS, PlayEvent } from '@/lib/scoring';
import { colors, radius, typography } from '@/lib/theme';

type ButtonDef = { event: PlayEvent; tone: 'hit' | 'out' | 'walk' | 'reach' | 'dp' };

const ROW_ONE: ButtonDef[] = [
  { event: 'single', tone: 'hit' },
  { event: 'double', tone: 'hit' },
  { event: 'triple', tone: 'hit' },
  { event: 'hr', tone: 'hit' },
  { event: 'error', tone: 'reach' },
];

const ROW_TWO: ButtonDef[] = [
  { event: 'walk', tone: 'walk' },
  { event: 'sacrifice', tone: 'out' },
  { event: 'strikeout', tone: 'out' },
  { event: 'out', tone: 'out' },
  { event: 'double_play', tone: 'dp' },
];

export function PlayButtons({
  onPress,
  disabled,
  disabledEvents = [],
}: {
  onPress: (event: PlayEvent) => void;
  disabled?: boolean;
  disabledEvents?: PlayEvent[];
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {ROW_ONE.map((b) => (
          <Btn
            key={b.event}
            event={b.event}
            tone={b.tone}
            disabled={disabled || disabledEvents.includes(b.event)}
            onPress={() => onPress(b.event)}
          />
        ))}
      </View>
      <View style={styles.row}>
        {ROW_TWO.map((b) => (
          <Btn
            key={b.event}
            event={b.event}
            tone={b.tone}
            disabled={disabled || disabledEvents.includes(b.event)}
            onPress={() => onPress(b.event)}
          />
        ))}
      </View>
    </View>
  );
}

function Btn({
  event,
  tone,
  disabled,
  onPress,
}: {
  event: PlayEvent;
  tone: 'hit' | 'out' | 'walk' | 'reach' | 'dp';
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        tone === 'hit' && styles.hit,
        tone === 'out' && styles.out,
        tone === 'walk' && styles.walk,
        tone === 'reach' && styles.reach,
        tone === 'dp' && styles.dp,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text style={styles.btnLabel}>{EVENT_LABELS[event]}</Text>
      <Text style={styles.btnSub} numberOfLines={1}>
        {EVENT_FULL_LABELS[event]}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  row: { flexDirection: 'row', gap: 6 },
  btn: {
    flex: 1,
    height: 76,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    gap: 2,
    paddingHorizontal: 2,
  },
  hit: { backgroundColor: colors.primary, borderColor: colors.primary },
  out: { backgroundColor: colors.bgElevated, borderColor: colors.border },
  walk: { backgroundColor: '#78350f', borderColor: '#78350f' },
  reach: { backgroundColor: '#854d0e', borderColor: colors.accent },
  dp: { backgroundColor: '#1f2937', borderColor: colors.danger, borderWidth: 1.5 },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.35 },
  btnLabel: { ...typography.h2, color: colors.text, fontSize: 20 },
  btnSub: { ...typography.caption, color: colors.text, opacity: 0.85, fontSize: 10 },
});
