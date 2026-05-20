import { Pressable, StyleSheet, Text, View } from 'react-native';
import { EVENT_LABELS, PlayEvent } from '@/lib/scoring';
import { colors, radius, typography } from '@/lib/theme';

const HITS: { event: PlayEvent; label: string; sub: string }[] = [
  { event: 'single', label: EVENT_LABELS.single, sub: 'Single' },
  { event: 'double', label: EVENT_LABELS.double, sub: 'Double' },
  { event: 'triple', label: EVENT_LABELS.triple, sub: 'Triple' },
  { event: 'hr', label: EVENT_LABELS.hr, sub: 'Home run' },
];

const OUTS: { event: PlayEvent; label: string; sub: string }[] = [
  { event: 'walk', label: EVENT_LABELS.walk, sub: 'Walk' },
  { event: 'sacrifice', label: EVENT_LABELS.sacrifice, sub: 'Sacrifice' },
  { event: 'strikeout', label: EVENT_LABELS.strikeout, sub: 'Strikeout' },
  { event: 'out', label: EVENT_LABELS.out, sub: 'Out' },
];

export function PlayButtons({
  onPress,
  disabled,
}: {
  onPress: (event: PlayEvent) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {HITS.map((b) => (
          <Btn
            key={b.event}
            label={b.label}
            sub={b.sub}
            tone="hit"
            disabled={disabled}
            onPress={() => onPress(b.event)}
          />
        ))}
      </View>
      <View style={styles.row}>
        {OUTS.map((b) => (
          <Btn
            key={b.event}
            label={b.label}
            sub={b.sub}
            tone={b.event === 'walk' ? 'walk' : 'out'}
            disabled={disabled}
            onPress={() => onPress(b.event)}
          />
        ))}
      </View>
    </View>
  );
}

function Btn({
  label,
  sub,
  tone,
  disabled,
  onPress,
}: {
  label: string;
  sub: string;
  tone: 'hit' | 'out' | 'walk';
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
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text style={styles.btnLabel}>{label}</Text>
      <Text style={styles.btnSub}>{sub}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  btn: {
    flex: 1,
    height: 76,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    gap: 2,
  },
  hit: { backgroundColor: colors.primary, borderColor: colors.primary },
  out: { backgroundColor: colors.bgElevated, borderColor: colors.border },
  walk: { backgroundColor: '#78350f', borderColor: '#78350f' },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.4 },
  btnLabel: { ...typography.h2, color: colors.text, fontSize: 22 },
  btnSub: { ...typography.caption, color: colors.text, opacity: 0.85 },
});
