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
import { DartballLogo } from '@/components/DartballLogo';
import { Input } from '@/components/Input';
import { SegmentedTabs } from '@/components/SegmentedTabs';
import { AccountRole, useAuth } from '@/lib/auth';
import { colors, spacing, typography } from '@/lib/theme';

type Mode = 'signin' | 'register';

const MODE_TABS = [
  { value: 'signin', label: 'Sign in' },
  { value: 'register', label: 'Register' },
] as const;

const ROLE_TABS = [
  { value: 'individual', label: 'Player' },
  { value: 'manager', label: 'Team manager' },
] as const;

export default function LandingScreen() {
  const { signIn, signUp, isDemoMode } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [role, setRole] = useState<AccountRole>('individual');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [teamName, setTeamName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'signin') {
        await signIn(email.trim(), password);
      } else {
        await signUp({
          email: email.trim(),
          password,
          role,
          displayName: displayName.trim() || email.split('@')[0],
          teamName: role === 'manager' ? teamName.trim() : undefined,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  const submitLabel =
    mode === 'signin'
      ? 'Sign in'
      : role === 'manager'
        ? 'Create team & account'
        : 'Create account';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.kav}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <DartballLogo size={96} />
            <Text style={styles.tagline}>Official Dartball Association</Text>
          </View>

          {isDemoMode ? (
            <View style={styles.demoBanner}>
              <Text style={styles.demoText}>
                Preview mode — Supabase keys not set. Submissions are stored locally so
                you can flow through the screens.
              </Text>
            </View>
          ) : null}

          <View style={styles.card}>
            <SegmentedTabs value={mode} onChange={setMode} tabs={MODE_TABS} />

            {mode === 'register' ? (
              <View style={{ gap: spacing.sm }}>
                <Text style={styles.sectionLabel}>I am a…</Text>
                <SegmentedTabs value={role} onChange={setRole} tabs={ROLE_TABS} />
                <Text style={styles.hint}>
                  {role === 'manager'
                    ? 'Create a team and invite your roster after you sign up.'
                    : 'Create your player profile. You can request to join a team next.'}
                </Text>
              </View>
            ) : null}

            <View style={styles.fields}>
              {mode === 'register' ? (
                <Input
                  label="Display name"
                  placeholder="What teammates will see"
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoCapitalize="words"
                  autoComplete="name"
                />
              ) : null}

              {mode === 'register' && role === 'manager' ? (
                <Input
                  label="Team name"
                  placeholder="e.g. Dewey Decimals"
                  value={teamName}
                  onChangeText={setTeamName}
                  autoCapitalize="words"
                />
              ) : null}

              <Input
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
              />

              <Input
                label="Password"
                placeholder="At least 8 characters"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Button
              label={submitLabel}
              onPress={handleSubmit}
              loading={submitting}
              disabled={
                !email ||
                !password ||
                (mode === 'register' && role === 'manager' && !teamName)
              }
            />

            {mode === 'signin' ? (
              <Text style={styles.footnote}>
                New to dartball? Switch to <Text style={styles.bold}>Register</Text> to
                create a player profile or start a team.
              </Text>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  kav: { flex: 1 },
  scroll: { padding: spacing.lg, gap: spacing.xl, flexGrow: 1 },
  header: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg },
  tagline: { ...typography.caption, color: colors.textMuted, letterSpacing: 2 },
  demoBanner: {
    backgroundColor: colors.bgElevated,
    borderColor: colors.accent,
    borderWidth: 1,
    borderRadius: 10,
    padding: spacing.md,
  },
  demoText: { ...typography.caption, color: colors.accent },
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: 14,
    padding: spacing.lg,
    gap: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionLabel: { ...typography.label, color: colors.textMuted },
  hint: { ...typography.caption, color: colors.textMuted },
  fields: { gap: spacing.md },
  errorText: { ...typography.caption, color: colors.danger },
  footnote: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
  bold: { color: colors.text, fontWeight: '700' },
});
