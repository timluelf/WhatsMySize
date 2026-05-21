-- Lock down league creation to admins only.

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

drop policy if exists "leagues_insert_any" on public.leagues;

create policy "leagues_insert_admin" on public.leagues
  for insert with check (
    auth.uid() = created_by
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );
