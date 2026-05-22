-- Registration fees for league + tournament entry, plus payments tracking.
-- A team with a succeeded payment row is allowed to join; otherwise RLS blocks
-- the insert. Tournament creator (admin) bypasses the fee check so admin can
-- still pre-seat any team into a paid tournament.

alter table public.leagues
  add column if not exists registration_fee_cents int not null default 0
  check (registration_fee_cents >= 0);

alter table public.tournaments
  add column if not exists registration_fee_cents int not null default 0
  check (registration_fee_cents >= 0);

create table if not exists public.payments (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid not null references public.teams(id) on delete cascade,
  league_id uuid references public.leagues(id) on delete cascade,
  tournament_id uuid references public.tournaments(id) on delete cascade,
  amount_cents int not null check (amount_cents >= 0),
  stripe_session_id text unique,
  stripe_payment_intent_id text,
  status text not null default 'pending'
    check (status in ('pending', 'succeeded', 'failed', 'refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (league_id is not null or tournament_id is not null),
  check (not (league_id is not null and tournament_id is not null))
);

create index if not exists payments_team_id_idx on public.payments (team_id);
create index if not exists payments_league_id_idx on public.payments (league_id);
create index if not exists payments_tournament_id_idx on public.payments (tournament_id);

create unique index if not exists payments_unique_succeeded_league
  on public.payments (team_id, league_id)
  where status = 'succeeded' and league_id is not null;

create unique index if not exists payments_unique_succeeded_tournament
  on public.payments (team_id, tournament_id)
  where status = 'succeeded' and tournament_id is not null;

drop trigger if exists payments_updated_at on public.payments;
create trigger payments_updated_at
  before update on public.payments
  for each row execute function public.touch_updated_at();

alter table public.payments enable row level security;

create policy "payments_read_team_or_admin" on public.payments
  for select using (
    exists (select 1 from public.teams where id = team_id and manager_id = auth.uid())
    or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- Phase 1: managers can mark pending; in Phase 2 this becomes service-role only
-- and the Edge Function inserts/updates succeeded rows after the Stripe webhook.
create policy "payments_insert_manager" on public.payments
  for insert with check (
    exists (select 1 from public.teams where id = team_id and manager_id = auth.uid())
  );

create policy "payments_update_admin" on public.payments
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- Replace league join policy: require succeeded payment when fee > 0.
drop policy if exists "league_teams_insert_manager" on public.league_teams;
create policy "league_teams_insert_manager" on public.league_teams
  for insert with check (
    exists (select 1 from public.teams where id = team_id and manager_id = auth.uid())
    and (
      coalesce(
        (select registration_fee_cents from public.leagues where id = league_id),
        0
      ) = 0
      or exists (
        select 1 from public.payments
        where payments.league_id = league_teams.league_id
        and payments.team_id = league_teams.team_id
        and payments.status = 'succeeded'
      )
    )
  );

-- Replace tournament join policy: creator (admin) always allowed; managers
-- require succeeded payment when fee > 0.
drop policy if exists "tournament_teams_insert_manager_or_creator" on public.tournament_teams;
create policy "tournament_teams_insert_manager_or_creator" on public.tournament_teams
  for insert with check (
    exists (select 1 from public.tournaments where id = tournament_id and created_by = auth.uid())
    or (
      exists (select 1 from public.teams where id = team_id and manager_id = auth.uid())
      and (
        coalesce(
          (select registration_fee_cents from public.tournaments where id = tournament_id),
          0
        ) = 0
        or exists (
          select 1 from public.payments
          where payments.tournament_id = tournament_teams.tournament_id
          and payments.team_id = tournament_teams.team_id
          and payments.status = 'succeeded'
        )
      )
    )
  );
