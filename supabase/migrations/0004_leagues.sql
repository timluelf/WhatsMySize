-- Leagues and the teams that belong to them.

create table if not exists public.leagues (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  join_code text unique default substr(md5(random()::text), 1, 8),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.league_teams (
  league_id uuid not null references public.leagues(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (league_id, team_id)
);

create index if not exists league_teams_team_id_idx on public.league_teams (team_id);

alter table public.leagues enable row level security;
alter table public.league_teams enable row level security;

create policy "leagues_read_all" on public.leagues
  for select using (auth.role() = 'authenticated');

create policy "leagues_insert_any" on public.leagues
  for insert with check (auth.uid() = created_by);

create policy "leagues_update_creator" on public.leagues
  for update using (auth.uid() = created_by);

create policy "leagues_delete_creator" on public.leagues
  for delete using (auth.uid() = created_by);

create policy "league_teams_read_all" on public.league_teams
  for select using (auth.role() = 'authenticated');

create policy "league_teams_insert_manager" on public.league_teams
  for insert with check (
    exists (
      select 1 from public.teams
      where id = team_id and manager_id = auth.uid()
    )
  );

create policy "league_teams_delete_manager" on public.league_teams
  for delete using (
    exists (
      select 1 from public.teams
      where id = team_id and manager_id = auth.uid()
    )
  );
