-- 001_init.sql — copied exactly from docs/CONTRACT.md section 4 (v1.1). Dhia only.
-- Run once in Supabase: Dashboard -> SQL Editor -> paste -> Run.

-- ENUMS (values are part of the contract)
create type user_role      as enum ('patient', 'specialist');
create type lang           as enum ('darija', 'ar', 'fr', 'en');
create type consent_level  as enum ('summary_only', 'full_chat');
create type appt_type      as enum ('weekly', 'urgent');
create type appt_status    as enum ('scheduled', 'done', 'cancelled');
create type risk_level     as enum ('green', 'orange', 'red');
create type risk_source    as enum ('rules', 'llm', 'trend', 'sos', 'questionnaire');
create type alert_status   as enum ('open', 'seen', 'false_alarm', 'resolved');
create type msg_sender     as enum ('user', 'ai');
create type questionnaire  as enum ('phq9', 'gad7');

-- USERS
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        user_role not null,
  nickname    text not null,
  language    lang not null default 'darija',
  created_at  timestamptz not null default now()
);

create table patient_profiles (
  user_id          uuid primary key references profiles(id) on delete cascade,
  specialist_id    uuid references profiles(id),
  consent          consent_level not null default 'summary_only',
  emergency_name   text,
  emergency_email  text,
  weekly_dow       smallint check (weekly_dow between 0 and 6),  -- 0 = Monday
  weekly_time      time
);

create table specialist_profiles (
  user_id    uuid primary key references profiles(id) on delete cascade,
  specialty  text,
  bio        text
);

-- SESSIONS
create table appointments (
  id             uuid primary key default gen_random_uuid(),
  patient_id     uuid not null references profiles(id),
  specialist_id  uuid not null references profiles(id),
  starts_at      timestamptz not null,
  type           appt_type not null default 'weekly',
  status         appt_status not null default 'scheduled',
  created_at     timestamptz not null default now()
);

create table session_notes (
  id              uuid primary key default gen_random_uuid(),
  appointment_id  uuid not null unique references appointments(id) on delete cascade,
  notes           text,              -- private to the specialist
  takeaways       text,              -- shown to the patient
  created_at      timestamptz not null default now()
);

create table homework (
  id             uuid primary key default gen_random_uuid(),
  patient_id     uuid not null references profiles(id),
  specialist_id  uuid not null references profiles(id),
  title          text not null,
  description    text,
  due_date       date,
  done           boolean not null default false,
  created_at     timestamptz not null default now()
);

-- BETWEEN SESSIONS
create table checkins (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid not null references profiles(id),
  mood        smallint not null check (mood between 1 and 5),
  note        text,
  created_at  timestamptz not null default now()
);

create table messages (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid not null references profiles(id),
  sender      msg_sender not null,
  content     text not null,
  risk        risk_level,           -- set on user messages only
  created_at  timestamptz not null default now()
);

create table questionnaire_results (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid not null references profiles(id),
  kind        questionnaire not null,
  answers     smallint[] not null,   -- PHQ-9: 9 values, GAD-7: 7 values, each 0-3
  score       smallint not null,
  created_at  timestamptz not null default now()
);

-- SAFETY + SPECIALIST
create table alerts (
  id             uuid primary key default gen_random_uuid(),
  patient_id     uuid not null references profiles(id),
  specialist_id  uuid not null references profiles(id),
  level          risk_level not null check (level <> 'green'),
  source         risk_source not null,
  reason         text not null,
  message_id     uuid references messages(id),
  status         alert_status not null default 'open',
  created_at     timestamptz not null default now()
);

create table weekly_summaries (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid not null references profiles(id),
  week_start  date not null,          -- a Monday
  content     jsonb not null,         -- shape = WeeklySummaryContent, section 5
  created_at  timestamptz not null default now(),
  unique (patient_id, week_start)
);

alter publication supabase_realtime add table alerts;
