// Edge Function: Stripe webhook receiver. On checkout.session.completed,
// marks the payment row succeeded and seats the team into the league or
// tournament (writes bypass RLS via service role).
//
// Configure in Stripe dashboard:
//   Endpoint URL: https://<project-ref>.supabase.co/functions/v1/stripe-webhook
//   Listen for: checkout.session.completed (and optionally
//     checkout.session.expired, charge.refunded)
// Then set STRIPE_WEBHOOK_SECRET in Supabase secrets to the signing secret
// Stripe shows after creating the endpoint.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@17.4.0?target=denonext';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-11-20.acacia',
  httpClient: Stripe.createFetchHttpClient(),
});

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';

serve(async (req) => {
  const sig = req.headers.get('stripe-signature');
  if (!sig) return new Response('Missing signature', { status: 400 });
  if (!webhookSecret) {
    return new Response('Webhook secret not configured', { status: 500 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'verification failed';
    return new Response(`Webhook signature error: ${message}`, { status: 400 });
  }

  const serviceClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const teamId = session.metadata?.team_id;
      const leagueId = session.metadata?.league_id || null;
      const tournamentId = session.metadata?.tournament_id || null;

      // Flip payment to succeeded.
      await serviceClient
        .from('payments')
        .update({
          status: 'succeeded',
          stripe_payment_intent_id:
            typeof session.payment_intent === 'string'
              ? session.payment_intent
              : session.payment_intent?.id ?? null,
        })
        .eq('stripe_session_id', session.id);

      // Seat the team.
      if (teamId && leagueId) {
        const { error } = await serviceClient
          .from('league_teams')
          .insert({ league_id: leagueId, team_id: teamId });
        if (error && !error.message.toLowerCase().includes('duplicate')) {
          console.error('league seat error', error);
        }
      } else if (teamId && tournamentId) {
        const { error } = await serviceClient
          .from('tournament_teams')
          .insert({ tournament_id: tournamentId, team_id: teamId });
        if (error && !error.message.toLowerCase().includes('duplicate')) {
          console.error('tournament seat error', error);
        }
      }
    } else if (event.type === 'checkout.session.expired') {
      const session = event.data.object as Stripe.Checkout.Session;
      await serviceClient
        .from('payments')
        .update({ status: 'failed' })
        .eq('stripe_session_id', session.id);
    } else if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntentId =
        typeof charge.payment_intent === 'string'
          ? charge.payment_intent
          : charge.payment_intent?.id ?? null;
      if (paymentIntentId) {
        await serviceClient
          .from('payments')
          .update({ status: 'refunded' })
          .eq('stripe_payment_intent_id', paymentIntentId);
      }
    }

    return new Response('ok');
  } catch (err) {
    console.error('webhook handler error', err);
    return new Response('Handler error', { status: 500 });
  }
});
