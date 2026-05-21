-- Mock teams for testing tournaments and leagues without registering a
-- bunch of real users. Each team is technically managed by the admin
-- user (FK requirement), but they're meant to be filler. Run this in the
-- Supabase SQL Editor — idempotent, skips any team whose name already
-- exists.
--
-- Note: these teams have NO players. "Play live" from a tournament match
-- will fail because the rosters are empty. Use the "Save result" button
-- in the match modal to manually report scores and advance the bracket.

with admin as (
  select id from public.profiles where is_admin = true order by created_at limit 1
)
insert into public.teams (name, manager_id)
select t.name, admin.id
from (values
  ('Hammerheads'),
  ('Diamond Dogs'),
  ('Iron Lung Lounge'),
  ('Foul Tips'),
  ('Knuckleballers'),
  ('Sandbaggers'),
  ('The Outliers'),
  ('Designated Hitters'),
  ('Walk-Off Warriors'),
  ('High Heat'),
  ('Power Alley'),
  ('Triple Threats'),
  ('Cellar Dwellers'),
  ('Last Call Legends')
) as t(name)
cross join admin
where not exists (
  select 1 from public.teams where name = t.name
);
