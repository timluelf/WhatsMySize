-- Let the tournament creator add or remove any registered team
-- (not just their own). Other managers can still add/remove their
-- own team via the invite-code flow.

drop policy if exists "tournament_teams_insert_manager" on public.tournament_teams;
drop policy if exists "tournament_teams_delete_manager" on public.tournament_teams;

create policy "tournament_teams_insert_manager_or_creator" on public.tournament_teams
  for insert with check (
    exists (
      select 1 from public.teams
      where id = team_id and manager_id = auth.uid()
    )
    or exists (
      select 1 from public.tournaments
      where id = tournament_id and created_by = auth.uid()
    )
  );

create policy "tournament_teams_delete_manager_or_creator" on public.tournament_teams
  for delete using (
    exists (
      select 1 from public.teams
      where id = team_id and manager_id = auth.uid()
    )
    or exists (
      select 1 from public.tournaments
      where id = tournament_id and created_by = auth.uid()
    )
  );
