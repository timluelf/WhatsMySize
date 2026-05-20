import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/lib/theme';

type Props = {
  first: boolean;
  second: boolean;
  third: boolean;
  size?: number;
};

export function Diamond({ first, second, third, size = 200 }: Props) {
  const baseSize = size * 0.18;
  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <View
        style={[
          styles.diamond,
          {
            width: size * 0.78,
            height: size * 0.78,
            top: size * 0.11,
            left: size * 0.11,
          },
        ]}
      />
      <Base
        occupied={second}
        label="2B"
        size={baseSize}
        style={{ top: 0, left: size / 2 - baseSize / 2 }}
      />
      <Base
        occupied={third}
        label="3B"
        size={baseSize}
        style={{ top: size / 2 - baseSize / 2, left: 0 }}
      />
      <Base
        occupied={first}
        label="1B"
        size={baseSize}
        style={{ top: size / 2 - baseSize / 2, right: 0 }}
      />
      <Base
        occupied={false}
        label="H"
        size={baseSize}
        style={{ bottom: 0, left: size / 2 - baseSize / 2 }}
        isHome
      />
    </View>
  );
}

function Base({
  occupied,
  label,
  size,
  style,
  isHome,
}: {
  occupied: boolean;
  label: string;
  size: number;
  style: object;
  isHome?: boolean;
}) {
  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          backgroundColor: occupied ? colors.accent : colors.bgElevated,
          borderColor: isHome ? colors.text : colors.border,
        },
        style,
      ]}
    >
      <Text style={[styles.baseLabel, { color: occupied ? colors.bg : colors.textMuted }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative', alignSelf: 'center' },
  diamond: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: colors.border,
    transform: [{ rotate: '45deg' }],
  },
  base: {
    position: 'absolute',
    borderWidth: 2,
    transform: [{ rotate: '45deg' }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  baseLabel: {
    fontSize: 12,
    fontWeight: '700',
    transform: [{ rotate: '-45deg' }],
  },
});
