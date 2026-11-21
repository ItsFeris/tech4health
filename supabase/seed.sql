-- seed.sql — fake demo data. Written by B, loaded by Dhia. NO REAL PEOPLE OR HEALTH DATA.
--
-- How to use (Supabase can't create login accounts from SQL easily, so we do it in 2 steps):
--   1. In the app, sign up and onboard 4 accounts:
--        specialist "Dr. Amira", patients "Mehdi" (stable), "Karim" (falling mood), "Yasmine" (live crisis demo).
--   2. Supabase Dashboard -> SQL Editor -> paste this file -> Run.
-- It finds the accounts by nickname, links the patients to the specialist and adds one week of history.
-- Safe to run again: it deletes the previous demo history of these 3 patients first.

do $$
declare
  spec    uuid := (select id from profiles where role = 'specialist' and nickname = 'Dr. Amira' limit 1);
  mehdi   uuid := (select id from profiles where role = 'patient' and nickname = 'Mehdi' limit 1);
  karim   uuid := (select id from profiles where role = 'patient' and nickname = 'Karim' limit 1);
  yasmine uuid := (select id from profiles where role = 'patient' and nickname = 'Yasmine' limit 1);
  pids    uuid[];
begin
  if spec is null or mehdi is null or karim is null or yasmine is null then
    raise exception 'Create and onboard the 4 demo accounts first (see the top of seed.sql)';
  end if;
  pids := array[mehdi, karim, yasmine];

  update patient_profiles set specialist_id = spec where user_id = any(pids);

  delete from alerts where patient_id = any(pids);
  delete from checkins where patient_id = any(pids);
  delete from homework where patient_id = any(pids);
  delete from appointments where patient_id = any(pids);
  delete from messages where patient_id = any(pids);

  -- one check-in per day for the last 7 days (mood 1..5)
  insert into checkins (patient_id, mood, note, created_at)
  select p.pid, p.moods[d], p.notes[d], date_trunc('day', now()) - make_interval(days => 7 - d) + interval '20 hours'
  from (values
    (mehdi,   array[3,4,4,3,4,4,5], array[null,'Good day at work',null,null,null,null,'Saw friends']::text[]),
    (karim,   array[4,3,3,2,2,1,2], array[null,null,'Could not sleep',null,'Exam stress','Feeling empty',null]::text[]),
    (yasmine, array[3,3,2,3,4,3,3], array[null,null,'Argument at home',null,'Breathing helped',null,null]::text[])
  ) as p(pid, moods, notes), generate_series(1, 7) as d;

  insert into homework (patient_id, specialist_id, title, description, due_date, done) values
    (yasmine, spec, '5-minute breathing, every evening', 'Box breathing: in 4s, hold 4s, out 4s, hold 4s.', current_date + 3, false),
    (yasmine, spec, 'Write down 3 good things each day', null, current_date + 3, true),
    (mehdi,   spec, 'Walk 20 minutes outside', null, current_date + 2, true),
    (karim,   spec, 'Sleep diary', 'Note bedtime, wake time and how rested you feel.', current_date + 1, false);

  insert into appointments (patient_id, specialist_id, starts_at, type) values
    (yasmine, spec, date_trunc('day', now()) + interval '3 days 15 hours', 'weekly'),
    (mehdi,   spec, date_trunc('day', now()) + interval '2 days 9 hours', 'weekly'),
    (karim,   spec, date_trunc('day', now()) + interval '1 day 11 hours', 'urgent');

  insert into alerts (patient_id, specialist_id, level, source, reason, created_at) values
    (karim, spec, 'orange', 'trend', 'Mood fell from 4 to 1-2 over the last 5 days.', now() - interval '1 day');
end $$;
