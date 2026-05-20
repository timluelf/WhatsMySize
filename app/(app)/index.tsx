import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { useAuth } from '@/lib/auth';
import { colors, spacing, typography } from '@/lib/theme';

const UPCOMING_FEATURES = [
  'Schedule & results',
  'League standings',
  'Top leagues',
  'Player & team stats',
  'Live scoring',
] as const;

export default function HomeScreen() {
  const { profile, signOut } = useAuth();
  if (!profile) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome, {profile.displayName}</Text>
          <Text style={styles.role}>
            {profile.role === 'manager' ? 'Team manager' : 'Player'}
            {profile.teamName ? ` · ${profile.teamName}` : ' · No team yet'}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Coming up</Text>
          {UPCOMING_FEATURES.map((feature) => (
            <View key={feature} style={styles.featureRow}>
              <View style={styles.bullet} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <Button label="Sign out" variant="secondary" onPress={signOut} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, gap: spacing.xl },
  header: { gap: spacing.xs, marginTop: spacing.lg },
  greeting: { ...typography.h1, color: colors.text },
  role: { ...typography.body, color: colors.textMuted },
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: 14,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { ...typography.h3, color: colors.text },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  featureText: { ...typography.body, color: colors.text },
});
