-- Tournaments with single-elimination brackets.

create table if not exists public.tournaments (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  size int not null check (size in (4, 8, 16, 32)),
  join_code text unique default substr(md5(random()::text), 1, 8),
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'final')),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.tournament_teams (
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  seed int,
  joined_at timestamptz not null default now(),
  primary key (tournament_id, team_id)
);

create index if not exists tournament_teams_team_id_idx
  on public.tournament_teams (team_id);

create table if not exists public.tournament_matches (
  id uuid primary key default uuid_generate_v4(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  round int not null,
  slot int not null,
  team_a_id uuid references public.teams(id) on delete set null,
  team_b_id uuid references public.teams(id) on delete set null,
  team_a_score int,
  team_b_score int,
  winner_team_id uuid references public.teams(id) on delete set null,
  game_id uuid references public.games(id) on delete set null,
  unique (tournament_id, round, slot)
);

create index if not exists tournament_matches_tournament_idx
  on public.tournament_matches (tournament_id);

alter table public.tournaments enable row level security;
alter table public.tournament_teams enable row level security;
alter table public.tournament_matches enable row level security;

-- Tournaments: read all (authenticated). Admin-only insert. Creator updates/deletes.
create policy "tournaments_read_all" on public.tournaments
  for select using (auth.role() = 'authenticated');

create policy "tournaments_insert_admin" on public.tournaments
  for insert with check (
    auth.uid() = created_by
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

create policy "tournaments_update_creator" on public.tournaments
  for update using (auth.uid() = created_by);

create policy "tournaments_delete_creator" on public.tournaments
  for delete using (auth.uid() = created_by);

-- Tournament_teams: managers add/remove their own team; everyone reads.
create policy "tournament_teams_read_all" on public.tournament_teams
  for select using (auth.role() = 'authenticated');

create policy "tournament_teams_insert_manager" on public.tournament_teams
  for insert with check (
    exists (
      select 1 from public.teams
      where id = team_id and manager_id = auth.uid()
    )
  );

create policy "tournament_teams_delete_manager" on public.tournament_teams
  for delete using (
    exists (
      select 1 from public.teams
      where id = team_id and manager_id = auth.uid()
    )
  );

-- Matches: only the tournament creator can write.
create policy "tournament_matches_read_all" on public.tournament_matches
  for select using (auth.role() = 'authenticated');

create policy "tournament_matches_insert_creator" on public.tournament_matches
  for insert with check (
    exists (
      select 1 from public.tournaments
      where id = tournament_id and created_by = auth.uid()
    )
  );

create policy "tournament_matches_update_creator" on public.tournament_matches
  for update using (
    exists (
      select 1 from public.tournaments
      where id = tournament_id and created_by = auth.uid()
    )
  );

create policy "tournament_matches_delete_creator" on public.tournament_matches
  for delete using (
    exists (
      select 1 from public.tournaments
      where id = tournament_id and created_by = auth.uid()
    )
  );
