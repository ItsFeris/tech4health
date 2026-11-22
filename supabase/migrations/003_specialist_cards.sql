-- v1.4: specialists patients can choose from + in-app verification. Additive only.
alter table specialist_profiles
  add column if not exists languages   lang[] not null default '{}',
  add column if not exists years       smallint check (years between 0 and 60),
  add column if not exists price       smallint check (price between 0 and 1000),  -- DT per 50-min session
  add column if not exists photo_url   text,
  add column if not exists verified    boolean not null default false,
  add column if not exists verified_at timestamptz,
  add column if not exists accepting   boolean not null default true;

-- Specialists created before verification existed stay visible to patients.
update specialist_profiles set verified = true, verified_at = now() where verified = false;

-- Every specialist account gets a card row (older accounts may have none).
insert into specialist_profiles (user_id, verified, verified_at)
select id, true, now() from profiles where role = 'specialist'
on conflict (user_id) do nothing;
