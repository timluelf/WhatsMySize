import { isSupabaseConfigured, supabase } from './supabase';

export type CheckoutTarget =
  | { kind: 'league'; leagueId: string }
  | { kind: 'tournament'; tournamentId: string };

export async function startCheckout(params: {
  teamId: string;
  target: CheckoutTarget;
  returnUrl: string;
}): Promise<string> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');
  const body = {
    teamId: params.teamId,
    leagueId: params.target.kind === 'league' ? params.target.leagueId : null,
    tournamentId:
      params.target.kind === 'tournament' ? params.target.tournamentId : null,
    returnUrl: params.returnUrl,
  };
  const { data, error } = await supabase!.functions.invoke<{
    url: string;
    error?: string;
  }>('create-checkout-session', { body });
  if (error) throw error;
  if (!data?.url) throw new Error(data?.error ?? 'No checkout URL returned');
  return data.url;
}
