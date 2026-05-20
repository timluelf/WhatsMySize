import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
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
  joinTeam: (code: string) => Promise<void>;
  leaveTeam: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const DEMO_PROFILE_KEY = 'dartball.demo.profile';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

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
        const { data, error } = await supabase!.auth.signUp({ email, password });
        if (error) throw error;
        if (!data.user) throw new Error('Signup did not return a user');

        let teamId: string | null = null;
        if (role === 'manager' && teamName) {
          const { data: team, error: teamErr } = await supabase!
            .from('teams')
            .insert({ name: teamName, manager_id: data.user.id })
            .select('id')
            .single();
          if (teamErr) throw teamErr;
          teamId = team.id;
        }
        const { error: profileErr } = await supabase!.from('profiles').insert({
          id: data.user.id,
          email,
          display_name: displayName,
          role,
          team_id: teamId,
        });
        if (profileErr) throw profileErr;
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
