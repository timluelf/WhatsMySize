-- Games persistence. Apply after 0001_init.sql.
-- The full GameState is stored as JSONB in `state` so resume is exact.
-- Denormalized columns (team names, score, status) make listing fast.

create table if not exists public.games (
  id uuid primary key default uuid_generate_v4(),
  state jsonb not null,
  away_team_name text not null,
  home_team_name text not null,
  away_team_abbr text not null,
  home_team_abbr text not null,
  away_score int not null default 0,
  home_score int not null default 0,
  inning int not null default 1,
  half text not null default 'top' check (half in ('top', 'bottom')),
  total_innings int not null default 7,
  status text not null default 'in_progress' check (status in ('in_progress', 'final')),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists games_created_by_updated_at_idx
  on public.games (created_by, updated_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists games_updated_at on public.games;
create trigger games_updated_at
  before update on public.games
  for each row execute function public.touch_updated_at();

alter table public.games enable row level security;

-- For now: the creator (the scorekeeper) can read and write their own games.
-- We'll widen this to teammates / leagues later.
create policy "games_select_own" on public.games
  for select using (auth.uid() = created_by);

create policy "games_insert_own" on public.games
  for insert with check (auth.uid() = created_by);

create policy "games_update_own" on public.games
  for update using (auth.uid() = created_by);

create policy "games_delete_own" on public.games
  for delete using (auth.uid() = created_by);
