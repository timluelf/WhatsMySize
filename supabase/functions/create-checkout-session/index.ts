// Edge Function: creates a Stripe Checkout Session for a team paying a
// league or tournament registration fee. Returns the Checkout URL the
// client should redirect to. A pending payment row is inserted up-front;
// the webhook flips it to 'succeeded' and seats the team.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@17.4.0?target=denonext';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-11-20.acacia',
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Authorization header');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userErr,
    } = await userClient.auth.getUser();
    if (userErr || !user) throw new Error('Not authenticated');

    const { teamId, leagueId, tournamentId, returnUrl } = await req.json();
    if (!teamId) throw new Error('teamId required');
    if (!leagueId && !tournamentId) {
      throw new Error('leagueId or tournamentId required');
    }
    if (leagueId && tournamentId) {
      throw new Error('Provide only one of leagueId or tournamentId');
    }
    if (!returnUrl) throw new Error('returnUrl required');

    const { data: team, error: teamErr } = await userClient
      .from('teams')
      .select('id, name, manager_id')
      .eq('id', teamId)
      .single();
    if (teamErr || !team) throw new Error('Team not found');
    if (team.manager_id !== user.id) {
      throw new Error('Only the team manager can pay');
    }

    let amountCents = 0;
    let label = '';

    if (leagueId) {
      const { data: lg, error: lgErr } = await userClient
        .from('leagues')
        .select('name, registration_fee_cents')
        .eq('id', leagueId)
        .single();
      if (lgErr || !lg) throw new Error('League not found');
      amountCents = lg.registration_fee_cents ?? 0;
      label = `${lg.name} registration`;
    } else {
      const { data: tr, error: trErr } = await userClient
        .from('tournaments')
        .select('name, registration_fee_cents, status')
        .eq('id', tournamentId)
        .single();
      if (trErr || !tr) throw new Error('Tournament not found');
      if (tr.status !== 'open') throw new Error('Tournament has already started');
      amountCents = tr.registration_fee_cents ?? 0;
      label = `${tr.name} registration`;
    }

    if (amountCents <= 0) {
      throw new Error('This entry is free — no payment needed');
    }

    // Already paid?
    const serviceClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: existing } = await serviceClient
      .from('payments')
      .select('id, status')
      .eq('team_id', teamId)
      .eq(leagueId ? 'league_id' : 'tournament_id', leagueId ?? tournamentId)
      .eq('status', 'succeeded')
      .maybeSingle();
    if (existing) throw new Error('Already paid');

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: `${label} — ${team.name}` },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${returnUrl}?payment=success`,
      cancel_url: `${returnUrl}?payment=cancel`,
      metadata: {
        team_id: teamId,
        league_id: leagueId ?? '',
        tournament_id: tournamentId ?? '',
        user_id: user.id,
      },
    });

    await serviceClient.from('payments').insert({
      team_id: teamId,
      league_id: leagueId ?? null,
      tournament_id: tournamentId ?? null,
      amount_cents: amountCents,
      stripe_session_id: session.id,
      status: 'pending',
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
