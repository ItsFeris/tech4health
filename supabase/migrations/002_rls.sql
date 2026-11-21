-- 002_rls.sql — row-level security. Dhia only. Run after 001_init.sql.
-- The frontend never reads tables directly: everything goes through the backend, which uses the service key
-- (the service key bypasses RLS). So the safe default is: RLS ON everywhere, no access for browsers,
-- except what Supabase Realtime needs to push new alerts to the logged-in specialist.

alter table profiles              enable row level security;
alter table patient_profiles      enable row level security;
alter table specialist_profiles   enable row level security;
alter table appointments          enable row level security;
alter table session_notes         enable row level security;
alter table homework              enable row level security;
alter table checkins              enable row level security;
alter table messages              enable row level security;
alter table questionnaire_results enable row level security;
alter table alerts                enable row level security;
alter table weekly_summaries      enable row level security;

-- Realtime: a specialist receives INSERT events only for their own alerts.
create policy "specialist reads own alerts" on alerts
  for select to authenticated
  using (specialist_id = auth.uid());
