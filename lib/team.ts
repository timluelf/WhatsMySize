import { isSupabaseConfigured, supabase } from './supabase';

export type TeamDetail = {
  id: string;
  name: string;
  inviteCode: string;
  managerId: string;
};

export type RosterMember = {
  id: string;
  displayName: string;
  email: string;
  role: 'individual' | 'manager';
};

export async function getTeam(teamId: string): Promise<TeamDetail | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase!
    .from('teams')
    .select('id, name, invite_code, manager_id')
    .eq('id', teamId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    inviteCode: data.invite_code,
    managerId: data.manager_id,
  };
}

export async function getRoster(teamId: string): Promise<RosterMember[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase!
    .from('profiles')
    .select('id, display_name, email, role')
    .eq('team_id', teamId)
    .order('role', { ascending: true })
    .order('display_name', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    displayName: row.display_name,
    email: row.email,
    role: row.role,
  }));
}

export async function regenerateInviteCode(teamId: string): Promise<string> {
  if (!isSupabaseConfigured) return 'DEMO' + Date.now().toString(36).toUpperCase();
  const next = generateCode();
  const { error } = await supabase!
    .from('teams')
    .update({ invite_code: next })
    .eq('id', teamId);
  if (error) throw error;
  return next;
}

function generateCode(): string {
  // 8-char, no ambiguous chars (0/O, 1/I/L)
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 8; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}
