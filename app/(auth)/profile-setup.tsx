import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useAuth } from '@/lib/auth';
import { colors, spacing, typography } from '@/lib/theme';

export default function ProfileSetupScreen() {
  const { profile, completeProfile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [teamCode, setTeamCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      await completeProfile({
        displayName: displayName.trim() || profile?.displayName || '',
        // Team join via code is stubbed for now — wire to a server function later.
        teamId: teamCode.trim() ? `pending-${teamCode.trim()}` : null,
        teamName: teamCode.trim() ? `Team ${teamCode.trim()}` : null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Finish your profile</Text>
            <Text style={styles.subtitle}>
              Confirm how teammates will see you. You can request to join a team now or
              do it later.
            </Text>
          </View>

          <View style={styles.card}>
            <Input
              label="Display name"
              placeholder="What teammates will see"
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
            />
            <Input
              label="Team invite code (optional)"
              placeholder="Paste the code your manager sent"
              value={teamCode}
              onChangeText={setTeamCode}
              autoCapitalize="characters"
            />
            <Text style={styles.hint}>
              No code yet? You can join a team later from your profile.
            </Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Button
              label="Save and continue"
              onPress={handleSubmit}
              loading={submitting}
              disabled={!displayName.trim()}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, gap: spacing.xl, flexGrow: 1 },
  header: { gap: spacing.sm, marginTop: spacing.lg },
  title: { ...typography.h1, color: colors.text },
  subtitle: { ...typography.body, color: colors.textMuted },
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: 14,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hint: { ...typography.caption, color: colors.textMuted },
  errorText: { ...typography.caption, color: colors.danger },
});
