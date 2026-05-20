import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { isSupabaseConfigured, supabase } from './supabase';

export type AccountRole = 'individual' | 'manager';

export type Profile = {
  id: string;
  email: string;
  displayName: string;
  role: AccountRole;
  teamId: string | null;
  teamName: string | null;
  needsProfileSetup: boolean;
};

type AuthState = {
  loading: boolean;
  profile: Profile | null;
  isDemoMode: boolean;
};

type AuthContextValue = AuthState & {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (params: {
    email: string;
    password: string;
    role: AccountRole;
    displayName: string;
    teamName?: string;
  }) => Promise<void>;
  completeProfile: (updates: Partial<Profile>) => Promise<void>;
  createTeam: (name: string) => Promise<void>;
  joinTeam: (code: string) => Promise<void>;
  leaveTeam: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const DEMO_PROFILE_KEY = 'dartball.demo.profile';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // While signUp is running we set its own profile state authoritatively.
  // The onAuthStateChange listener races against the team/profile inserts,
  // so it would otherwise overwrite with a fallback profile.
  const signingUpRef = useRef(false);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      if (!isSupabaseConfigured) {
        const raw = await AsyncStorage.getItem(DEMO_PROFILE_KEY);
        if (active) {
          setProfile(raw ? (JSON.parse(raw) as Profile) : null);
          setLoading(false);
        }
        return;
      }

      const { data } = await supabase!.auth.getSession();
      if (active && data.session?.user) {
        setProfile(await loadProfile(data.session.user.id, data.session.user.email ?? ''));
      }
      if (active) setLoading(false);

      supabase!.auth.onAuthStateChange(async (_event, session) => {
        if (signingUpRef.current) return;
        if (!session?.user) {
          setProfile(null);
          return;
        }
        setProfile(await loadProfile(session.user.id, session.user.email ?? ''));
      });
    }

    bootstrap();
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      profile,
      isDemoMode: !isSupabaseConfigured,

      async signIn(email, password) {
        if (!isSupabaseConfigured) {
          const demo: Profile = {
            id: `demo-${email}`,
            email,
            displayName: email.split('@')[0],
            role: 'individual',
            teamId: null,
            teamName: null,
            needsProfileSetup: false,
          };
          await AsyncStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify(demo));
          setProfile(demo);
          return;
        }
        const { error } = await supabase!.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },

      async signUp({ email, password, role, displayName, teamName }) {
        if (!isSupabaseConfigured) {
          const demo: Profile = {
            id: `demo-${email}`,
            email,
            displayName,
            role,
            teamId: role === 'manager' ? `team-${Date.now()}` : null,
            teamName: role === 'manager' ? teamName ?? null : null,
            needsProfileSetup: false,
          };
          await AsyncStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify(demo));
          setProfile(demo);
          return;
        }

        signingUpRef.current = true;
        try {
          const { data, error } = await supabase!.auth.signUp({ email, password });
          if (error) throw error;
          if (!data.user) throw new Error('Signup did not return a user');

          // Insert the profile row first (without a team). This guarantees that
          // role='manager' is durable even if the team insert later fails — the
          // home screen will show a "Create your team" recovery card.
          const { error: profileErr } = await supabase!.from('profiles').insert({
            id: data.user.id,
            email,
            display_name: displayName,
            role,
            team_id: null,
          });
          if (profileErr) throw profileErr;

          let teamId: string | null = null;
          let teamNameOut: string | null = null;
          if (role === 'manager' && teamName) {
            const trimmedTeam = teamName.trim();
            const { data: team, error: teamErr } = await supabase!
              .from('teams')
              .insert({ name: trimmedTeam, manager_id: data.user.id })
              .select('id, name')
              .single();
            if (teamErr) throw teamErr;
            teamId = team.id;
            teamNameOut = team.name;

            const { error: linkErr } = await supabase!
              .from('profiles')
              .update({ team_id: teamId })
              .eq('id', data.user.id);
            if (linkErr) throw linkErr;
          }

          // Set local state authoritatively to bypass the racey listener.
          setProfile({
            id: data.user.id,
            email,
            displayName,
            role,
            teamId,
            teamName: teamNameOut,
            needsProfileSetup: false,
          });
        } finally {
          signingUpRef.current = false;
        }
      },

      async completeProfile(updates) {
        if (!profile) return;
        const merged: Profile = { ...profile, ...updates, needsProfileSetup: false };
        if (!isSupabaseConfigured) {
          await AsyncStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify(merged));
          setProfile(merged);
          return;
        }
        const { error } = await supabase!
          .from('profiles')
          .update({
            display_name: merged.displayName,
            team_id: merged.teamId,
          })
          .eq('id', merged.id);
        if (error) throw error;
        setProfile(merged);
      },

      async createTeam(name) {
        if (!profile) throw new Error('Not signed in');
        if (profile.role !== 'manager') {
          throw new Error('Only managers can create a team');
        }
        if (profile.teamId) throw new Error('You already have a team');
        const trimmed = name.trim();
        if (!trimmed) throw new Error('Team name required');

        if (!isSupabaseConfigured) {
          const updated: Profile = {
            ...profile,
            teamId: `team-${Date.now()}`,
            teamName: trimmed,
          };
          await AsyncStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify(updated));
          setProfile(updated);
          return;
        }

        const { data: team, error } = await supabase!
          .from('teams')
          .insert({ name: trimmed, manager_id: profile.id })
          .select('id, name')
          .single();
        if (error) throw error;

        const { error: updateErr } = await supabase!
          .from('profiles')
          .update({ team_id: team.id })
          .eq('id', profile.id);
        if (updateErr) throw updateErr;

        setProfile({ ...profile, teamId: team.id, teamName: team.name });
      },

      async joinTeam(code) {
        if (!profile) throw new Error('Not signed in');
        const trimmed = code.trim();
        if (!trimmed) throw new Error('Enter an invite code');

        if (!isSupabaseConfigured) {
          const updated: Profile = {
            ...profile,
            teamId: `team-${trimmed.toLowerCase()}`,
            teamName: `Team ${trimmed.toUpperCase()}`,
            needsProfileSetup: false,
          };
          await AsyncStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify(updated));
          setProfile(updated);
          return;
        }

        const { data: team, error } = await supabase!
          .from('teams')
          .select('id, name')
          .eq('invite_code', trimmed)
          .maybeSingle();
        if (error) throw error;
        if (!team) throw new Error('No team found with that code');

        const { error: updateErr } = await supabase!
          .from('profiles')
          .update({ team_id: team.id })
          .eq('id', profile.id);
        if (updateErr) throw updateErr;

        setProfile({
          ...profile,
          teamId: team.id,
          teamName: team.name,
          needsProfileSetup: false,
        });
      },

      async leaveTeam() {
        if (!profile) throw new Error('Not signed in');
        if (profile.role === 'manager') {
          throw new Error('Managers cannot leave their own team');
        }
        if (!isSupabaseConfigured) {
          const updated: Profile = { ...profile, teamId: null, teamName: null };
          await AsyncStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify(updated));
          setProfile(updated);
          return;
        }
        const { error } = await supabase!
          .from('profiles')
          .update({ team_id: null })
          .eq('id', profile.id);
        if (error) throw error;
        setProfile({ ...profile, teamId: null, teamName: null });
      },

      async signOut() {
        if (!isSupabaseConfigured) {
          await AsyncStorage.removeItem(DEMO_PROFILE_KEY);
          setProfile(null);
          return;
        }
        await supabase!.auth.signOut();
        setProfile(null);
      },
    }),
    [loading, profile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

async function loadProfile(userId: string, email: string): Promise<Profile | null> {
  const { data, error } = await supabase!
    .from('profiles')
    .select('id, email, display_name, role, team_id, teams(name)')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) {
    return {
      id: userId,
      email,
      displayName: email.split('@')[0],
      role: 'individual',
      teamId: null,
      teamName: null,
      needsProfileSetup: true,
    };
  }

  const team = Array.isArray(data.teams) ? data.teams[0] : data.teams;
  return {
    id: data.id,
    email: data.email,
    displayName: data.display_name,
    role: data.role as AccountRole,
    teamId: data.team_id,
    teamName: team?.name ?? null,
    needsProfileSetup: false,
  };
}
