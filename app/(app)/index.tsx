import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { useAuth } from '@/lib/auth';
import { useGame } from '@/lib/gameStore';
import { colors, radius, spacing, typography } from '@/lib/theme';

const UPCOMING_FEATURES = [
  'Schedule & results',
  'League standings',
  'Top leagues',
  'Player & team stats',
] as const;

export default function HomeScreen() {
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const { game } = useGame();
  if (!profile) return null;

  const gameInProgress = game && game.status !== 'final';

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

        <View style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>LIVE SCORING</Text>
          <Text style={styles.heroTitle}>
            {gameInProgress ? 'Game in progress' : 'Score a game'}
          </Text>
          <Text style={styles.heroSub}>
            {gameInProgress
              ? `${game.away.abbreviation} @ ${game.home.abbreviation} — inning ${game.inning}`
              : 'Pick two teams, tap each at-bat, the app keeps the book.'}
          </Text>
          {gameInProgress ? (
            <Button label="Resume game" onPress={() => router.push('/games/live')} />
          ) : (
            <Button label="Start a game" onPress={() => router.push('/games/new')} />
          )}
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
  heroCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  heroEyebrow: { ...typography.caption, color: colors.primary, letterSpacing: 3 },
  heroTitle: { ...typography.h2, color: colors.text },
  heroSub: { ...typography.body, color: colors.textMuted, marginBottom: spacing.sm },
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
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
