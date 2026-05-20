import { StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '@/lib/theme';

export function DartballLogo({ size = 96 }: { size?: number }) {
  const cell = size / 5;
  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.board,
          { width: size, height: size, borderWidth: Math.max(2, size * 0.04) },
        ]}
      >
        {/* simplified board: red strip top, brown strip bottom, white middle */}
        <View style={[styles.row, { height: cell, backgroundColor: colors.board.red }]} />
        <View
          style={[
            styles.row,
            { flex: 1, backgroundColor: colors.board.white, position: 'relative' },
          ]}
        >
          {/* diamond */}
          <View
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: size * 0.5,
              height: size * 0.5,
              marginLeft: -size * 0.25,
              marginTop: -size * 0.25,
              transform: [{ rotate: '45deg' }],
              borderWidth: 2,
              borderColor: colors.bg,
            }}
          />
        </View>
        <View style={[styles.row, { height: cell, backgroundColor: colors.board.brown }]} />
      </View>
      <Text style={styles.wordmark}>DARTBALL</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 12 },
  board: {
    borderColor: colors.board.grey,
    overflow: 'hidden',
    borderRadius: 8,
  },
  row: { width: '100%' },
  wordmark: {
    ...typography.h2,
    color: colors.text,
    letterSpacing: 4,
  },
});
