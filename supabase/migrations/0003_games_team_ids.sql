-- Add denormalized team_id columns to games so we can list games for a team
-- without parsing the JSONB state.

alter table public.games
  add column if not exists away_team_id text,
  add column if not exists home_team_id text;

update public.games
set away_team_id = state->'away'->>'id'
where away_team_id is null;

update public.games
set home_team_id = state->'home'->>'id'
where home_team_id is null;

create index if not exists games_away_team_id_idx on public.games (away_team_id);
create index if not exists games_home_team_id_idx on public.games (home_team_id);
