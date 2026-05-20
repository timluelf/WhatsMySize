-- Initial schema for the Dartball app.
-- Apply with: supabase db push  (or paste into Supabase SQL editor)

create extension if not exists "uuid-ossp";

create table if not exists public.teams (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  manager_id uuid not null references auth.users(id) on delete cascade,
  invite_code text unique default substr(md5(random()::text), 0, 9),
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null,
  role text not null check (role in ('individual', 'manager')),
  team_id uuid references public.teams(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.team_invites (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid not null references public.teams(id) on delete cascade,
  email text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.team_invites enable row level security;

-- Profiles: anyone signed in can read, owner can update, owner can insert their row.
create policy "profiles_read_all" on public.profiles
  for select using (auth.role() = 'authenticated');

create policy "profiles_insert_self" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_self" on public.profiles
  for update using (auth.uid() = id);

-- Teams: anyone signed in can read, only manager can update; any signed-in user can insert.
create policy "teams_read_all" on public.teams
  for select using (auth.role() = 'authenticated');

create policy "teams_insert_any" on public.teams
  for insert with check (auth.uid() = manager_id);

create policy "teams_update_manager" on public.teams
  for update using (auth.uid() = manager_id);

-- Invites: managers can manage their team's invites; invitees can read invites for their email.
create policy "invites_read_owner_or_invitee" on public.team_invites
  for select using (
    exists (select 1 from public.teams t where t.id = team_id and t.manager_id = auth.uid())
    or email = (select email from public.profiles where id = auth.uid())
  );

create policy "invites_insert_manager" on public.team_invites
  for insert with check (
    exists (select 1 from public.teams t where t.id = team_id and t.manager_id = auth.uid())
  );

create policy "invites_update_invitee" on public.team_invites
  for update using (
    email = (select email from public.profiles where id = auth.uid())
  );
