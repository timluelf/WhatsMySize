import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, typography } from '@/lib/theme';

type Tab<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  tabs: readonly Tab<T>[];
};

export function SegmentedTabs<T extends string>({ value, onChange, tabs }: Props<T>) {
  return (
    <View style={styles.row}>
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <Pressable
            key={tab.value}
            onPress={() => onChange(tab.value)}
            style={[styles.tab, active && styles.tabActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  tabActive: { backgroundColor: colors.primary },
  label: { ...typography.label, color: colors.textMuted },
  labelActive: { color: colors.text },
});
