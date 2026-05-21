-- Link a game to the tournament match it represents.
-- Saving a final game with this set advances the bracket automatically (see lib/games.ts).

alter table public.games
  add column if not exists tournament_match_id uuid
    references public.tournament_matches(id) on delete set null;

create index if not exists games_tournament_match_id_idx
  on public.games (tournament_match_id);
