# Tech4Health — Locked design spec (team contract)

Version 1.5 · frozen Nov 22, 2026 (1.1: team cut to 3 people · 1.2: Dhia builds all screens from the design · 1.3: AI tools, `ChatReply.actions` · 1.4: choose a specialist, specialist price & verification, session takeaways · 1.5: change or leave specialist) · source doc: https://claude.ai/artifact/XyrztKDxje9S6nP8ZJWQbW

## 1. Lock rules

Version 1.1 is frozen (1.1: team cut to 3 people, see section 2): the database schema, API contract, enums and module interfaces below change only through the process in this section. Everything else is free for each owner to build as they like.

| Locked (needs the process) | Free (owner decides) |
| --- | --- |
| Table names, column names and types, enum values | Internal code inside your folder |
| Endpoint paths, methods, request and response JSON | UI layout, styling, components |
| Module function signatures in section 6 | Prompts, keyword lists, model choice |
| Folder ownership in section 2 | Helper functions that nobody else calls |

To change something locked:

1. Comment on the exact line in the source doc, or open a GitHub issue labelled `contract-change`.
2. The owner of that part and every person who consumes it agree in the comment thread.
3. Update this file first, bump the version (1.0 → 1.1), then change the code.
4. Post one line in the team chat: what changed and who must update.

Adding something (a new optional field, a new endpoint) only needs a heads-up. Renaming, removing or changing a type needs everyone's OK.

## 2. Team and ownership

Three people: Dhia owns everything that can break silently (database, security, risk engine, wiring), and the two vibe coders own screens and text, working only against mock data in their own folders.

| Role | Name | Owns (folders) | Delivers |
| --- | --- | --- | --- |
| Lead + backend | Dhia | `backend/`, `supabase/`, `frontend/src/api/`, `frontend/src/types/`, `frontend/src/mocks/`, the frontend skeleton | Supabase tables and access rules, FastAPI, Groq wrapper, chat, weekly summary, risk engine, alerts, emails, connecting the frontend to the real API, reviewing and merging every PR |
| A — Patient app testing | TBD | small fixes in `frontend/src/pages/patient/` with Dhia's OK | Tests the patient app on real phones, reports bugs, rehearses the patient side of the demo |
| B — Content | TBD | `docs/`, prompts, keywords, `supabase/seed.sql` | AI system prompt (darija/French), summary prompt, crisis keyword list, crisis screen text, fake demo patients, demo script, slides |

Since v1.2, Dhia builds all 15 screens from the Claude Design file: https://claude.ai/artifact/5jNb1t3kYf15GJuWdwRQFy. The shared look is in `frontend/src/components/t4h/`.

Before A and B start, Dhia sets up in about 1 to 2 hours: the React + Vite + Tailwind + shadcn/ui skeleton with routing, a login page and an empty layout for each side; `contract.ts` and one typed mock file per type; and `src/api/` functions such as `getPatients()` and `sendChat()` that return mocks for now. Later Dhia switches those functions to the real backend without touching any page.

Rules for A and B:

- Stay in your own folder. Never edit `contract.ts`, `src/api/`, `src/mocks/` or anything in `backend/`.
- One screen per AI prompt, never "build the whole app".
- If the AI wants a new field or endpoint, ask Dhia; don't invent it.
- Commit after every working screen, on your own branch, and open a PR. Dhia merges.
- Click through the screen once before committing. A blank page or a red error means don't push.

Prompt template for A and B:

```
I'm building one screen in a React + Vite + Tailwind + shadcn/ui app.
Screen: [Patient chat page]
What it does: [list 3-5 things]
Data: use ONLY these functions from src/api/: [sendChat(content) -> ChatReply, getChatHistory() -> Message[]]
Types (do not change them): [paste the relevant part of contract.ts]
Put the file in: src/pages/patient/ChatPage.tsx
Don't modify any other file. Mobile-friendly. Show a loading state and an error message.
```

Shared files, changed only by Dhia: `backend/app/main.py`, `backend/app/config.py`, `backend/app/models/`, `frontend/src/types/contract.ts`, `frontend/src/api/`, `frontend/src/mocks/`, both `.env.example` files.

Scope cut for 3 people: voice (STT/TTS), discreet mode, guided exercises and per-patient AI settings are postponed. The core loop stays: chat, then a risk alert live on the dashboard, then the weekly summary. Voice comes back only if Dhia has time at the end.

## 3. Repo structure

One GitHub repo (monorepo) with the frontend, backend and database migrations side by side; the owner of each folder is marked on the right.

```
tech4health/
├── frontend/                     # skeleton: Dhia
│   ├── src/
│   │   ├── types/contract.ts     # Dhia only: TS types = section 5
│   │   ├── api/                  # Dhia only: every fetch call, mocks first, real API later
│   │   ├── mocks/                # Dhia only: typed fake data that matches contract.ts
│   │   ├── lib/supabase.ts       # Dhia: login + realtime client
│   │   ├── pages/patient/        # A
│   │   ├── pages/specialist/     # B
│   │   └── components/           # shared UI pieces: add new files, don't edit others'
│   └── .env.example              # Dhia only
├── backend/                      # Dhia
│   ├── app/
│   │   ├── main.py               # creates the app, mounts routers
│   │   ├── config.py             # reads env vars
│   │   ├── models/               # Pydantic schemas = section 5
│   │   ├── db/                   # the ONLY code that talks to Supabase
│   │   ├── api/                  # one route file per resource
│   │   ├── ai/                   # llm.py is the ONLY code that calls Groq chat
│   │   │   └── prompts/          # B writes the prompt text here (.md files)
│   │   ├── risk/
│   │   │   └── keywords.txt      # B writes the crisis keyword list
│   │   ├── voice/                # postponed
│   │   └── notify/               # emails
│   ├── tests/
│   ├── requirements.txt
│   └── .env.example
├── supabase/                     # Dhia
│   ├── migrations/001_init.sql   # section 4, as is
│   └── seed.sql                  # demo patients written by B, loaded by Dhia
└── docs/                         # B
    ├── CONTRACT.md               # this file
    └── demo-script.md
```

Two hard rules: only `db/` touches the database, and only `ai/llm.py` calls the Groq chat API. Everyone else imports their functions (section 6).

## 4. Database schema

This SQL is `supabase/migrations/001_init.sql`, copied exactly: 10 tables and 10 enums, with user ids taken from Supabase Auth.

```sql
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
  bio        text,
  -- v1.4 (migration 003_specialist_cards.sql)
  languages   lang[] not null default '{}',
  years       smallint,             -- years of practice
  price       smallint,             -- DT per 50-min session
  photo_url   text,                 -- small data: URL or https URL
  verified    boolean not null default false,  -- only verified specialists are listed to patients
  verified_at timestamptz,
  accepting   boolean not null default true
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
```

Access rules (row-level security, Dhia):

- A patient reads and writes only rows where `patient_id` is their own id.
- A specialist reads rows of patients whose `patient_profiles.specialist_id` is their id.
- A specialist reads `messages` only when that patient's `consent` is `full_chat`.
- `session_notes.notes` is never returned to a patient; only `takeaways` is.
- The backend uses the service key, so the API routes must check the same rules too.

## 5. API contract

The backend exposes 25 endpoints under `/api/v1`, all JSON and all behind the Supabase login token; signup and login themselves go straight from the frontend to Supabase Auth.

| Method | Path | Caller | Screen | Body | Returns |
| --- | --- | --- | --- | --- | --- |
| GET | `/me` | both | A, B | — | `Me` |
| POST | `/onboarding/patient` | patient | A | `nickname, language, consent, emergency_name?, emergency_email?, specialist_id?` (v1.4) | `Me` |
| POST | `/onboarding/specialist` | specialist | B | `nickname, language, specialty?, bio?, languages?, years?, price?, photo_url?` (v1.4) | `Me` |
| GET | `/specialists` | any logged-in | A | — | `SpecialistCard[]` (v1.4: verified and accepting only; works before onboarding) |
| GET | `/specialists/{id}` | any logged-in | A, B | — | `SpecialistCard` (v1.4) |
| POST | `/me/verify` | specialist | B | `id_card, license, selfie` (all true) | `SpecialistCard` (v1.4: checks are simulated in the app) |
| GET | `/takeaways/latest` | patient | A | — | `Takeaways \| null` (v1.4: the specialist's note after the last session) |
| PATCH | `/me/consent` | patient | A | `consent` | `Me` |
| PATCH | `/me/specialist` | patient | A | `specialist_id` (a verified specialist, or `null` to leave) | `Me` (v1.5: upcoming sessions with the old specialist are cancelled; a patient with no specialist is sent to choose one) |
| GET | `/appointments` | both | A, B | — | `Appointment[]` (own, upcoming first) |
| POST | `/appointments` | specialist | B | `patient_id, starts_at, type` | `Appointment` |
| PATCH | `/appointments/{id}` | both | A, B | `starts_at?, status?` | `Appointment` |
| PUT | `/appointments/{id}/notes` | specialist | B | `notes?, takeaways?` | `SessionNote` |
| GET | `/homework?patient_id=` | both | A, B | — | `Homework[]` |
| POST | `/homework` | specialist | B | `patient_id, title, description?, due_date?` | `Homework` |
| PATCH | `/homework/{id}` | both | A, B | `done?, title?, description?` | `Homework` |
| POST | `/checkins` | patient | A | `mood, note?` | `CheckinReply` |
| GET | `/checkins?patient_id=&from=&to=` | both | A, B | — | `Checkin[]` |
| GET | `/patients` | specialist | B | — | `PatientRow[]` (red, then orange, then green) |
| GET | `/alerts?status=open` | specialist | B | — | `Alert[]` (newest first) |
| PATCH | `/alerts/{id}` | specialist | B | `status` | `Alert` |
| POST | `/chat` | patient | A | `content` | `ChatReply` |
| GET | `/chat/history?patient_id=&limit=50` | both | A, B | — | `Message[]` (specialist: only with `full_chat`) |
| POST | `/questionnaires` | patient | A | `kind, answers` | `QuestionnaireReply` |
| GET | `/questionnaires?patient_id=` | both | A, B | — | `QuestionnaireResult[]` |
| POST | `/summaries/generate` | specialist | B | `patient_id, week_start` | `WeeklySummary` |
| GET | `/summaries?patient_id=` | specialist | B | — | `WeeklySummary[]` |
| POST | `/sos` | patient | A | — | `SosReply` |
| POST | `/voice/stt` | patient | postponed | multipart `audio` file | `{ text, language }` |
| POST | `/voice/tts` | patient | postponed | `text, language` | `audio/mpeg` bytes |

Dhia builds every endpoint. The Screen column says whose pages call it, through the matching function in `src/api/`.

The response types below are `frontend/src/types/contract.ts`. The Pydantic models in `backend/app/models/` mirror them field for field.

```typescript
type Lang = 'darija' | 'ar' | 'fr' | 'en';
type Consent = 'summary_only' | 'full_chat';
type Risk = 'green' | 'orange' | 'red';
type RiskSource = 'rules' | 'llm' | 'trend' | 'sos' | 'questionnaire';

interface Me { id: string; role: 'patient' | 'specialist'; nickname: string; language: Lang;
  consent?: Consent; specialist_id?: string | null; emergency_name?: string | null; }

interface Appointment { id: string; patient_id: string; specialist_id: string; starts_at: string;
  type: 'weekly' | 'urgent'; status: 'scheduled' | 'done' | 'cancelled'; }

interface SessionNote { appointment_id: string; notes?: string | null; takeaways: string | null; }

interface Homework { id: string; patient_id: string; title: string; description: string | null;
  due_date: string | null; done: boolean; }

interface Checkin { id: string; mood: 1 | 2 | 3 | 4 | 5; note: string | null; created_at: string; }

interface Message { id: string; sender: 'user' | 'ai'; content: string; risk: Risk | null; created_at: string; }

interface RiskResult { level: Risk; source: RiskSource; reason: string; }

interface Crisis { title: string; body: string; actions: { label: string; kind: 'call' | 'sos' | 'breathing' }[]; }

interface ChatReply { user_message: Message; ai_message: Message; risk: RiskResult;
  crisis: Crisis | null; urgent_appointment: Appointment | null;
  actions: ChatAction[]; }   // v1.3: cards opened by Nour's tools, shown under ai_message ([] if none)
interface ChatAction {      // v1.3
  type: 'breathing' | 'grounding' | 'thought_record' | 'mood_logged' | 'homework_list' | 'homework_done' | 'next_session' | 'mood_history';
  pattern?: 'box' | '478' | 'slow' | null; cycles?: number | null;   // breathing
  situation?: string | null;                                         // thought_record
  checkin?: Checkin | null;                                          // mood_logged
  homework?: Homework[];                                             // homework_list, homework_done
  appointment?: Appointment | null;                                  // next_session (null = none booked)
  moods?: Checkin[];                                                 // mood_history
}

interface SpecialistCard {   // v1.4: public info a patient sees
  id: string; nickname: string; specialty: string | null; bio: string | null; languages: Lang[];
  years: number | null; price: number | null; photo_url: string | null; verified: boolean; accepting: boolean;
}
interface Takeaways { appointment_id: string; session_date: string; takeaways: string; }   // v1.4

interface CheckinReply { checkin: Checkin; ai_reply: string; risk: RiskResult; crisis: Crisis | null; }

interface QuestionnaireResult { id: string; kind: 'phq9' | 'gad7'; score: number;
  severity: 'minimal' | 'mild' | 'moderate' | 'moderately_severe' | 'severe'; created_at: string; }

interface QuestionnaireReply { result: QuestionnaireResult; risk: RiskResult; crisis: Crisis | null; }

interface SosReply { alert: Alert; crisis: Crisis; }

interface Alert { id: string; patient_id: string; patient_nickname: string; level: 'orange' | 'red';
  source: RiskSource; reason: string; message_excerpt: string | null;
  status: 'open' | 'seen' | 'false_alarm' | 'resolved'; created_at: string; }

interface PatientRow { patient_id: string; nickname: string; current_risk: Risk; open_alerts: number;
  last_mood: number | null; mood_7d: (number | null)[]; next_appointment: string | null; }

interface WeeklySummaryContent { mood_trend: 'improving' | 'stable' | 'declining';
  mood_avg: number | null; key_events: string[]; homework: { title: string; done: boolean }[];
  concerns: string[]; prep_topic: string | null; }

interface WeeklySummary { id: string; patient_id: string; week_start: string; content: WeeklySummaryContent; }

interface ApiError { error: { code: string; message: string } }
```

Safety exception to consent: an alert's `message_excerpt` (the message that triggered it, at most 200 characters) is always shown to the specialist, even with `summary_only`. The consent screen must say this in plain words.

## 6. Internal module interfaces

Backend modules (all Dhia's) call each other only through these functions, so each can start as a stub that returns fake data and be swapped for real code later.

```python
# ---------- db/ — the only code that touches Supabase ----------
async def get_patient_context(patient_id: UUID) -> PatientContext
    # nickname, language, consent, specialist_id, emergency_name/email,
    # open homework, last 20 messages, last 7 check-ins
async def save_message(patient_id: UUID, sender: str, content: str, risk: str | None) -> Message
async def save_checkin(patient_id: UUID, mood: int, note: str | None) -> Checkin
async def create_alert(patient_id: UUID, result: RiskResult, message_id: UUID | None) -> Alert
async def request_urgent_slot(patient_id: UUID) -> Appointment   # next free slot within 48 h
async def list_specialists() -> list[SpecialistCard]          # v1.4: verified + accepting
async def get_specialist(specialist_id: UUID) -> SpecialistCard | None
async def verify_specialist(specialist_id: UUID) -> SpecialistCard
async def latest_takeaways(patient_id: UUID) -> Takeaways | None
async def get_week_data(patient_id: UUID, week_start: date) -> WeekData
    # check-ins, homework, questionnaire results, and messages only if consent = full_chat

# ---------- ai/ ----------
# llm.py — the only code that calls Groq chat; risk/ uses it too
async def chat_completion(messages: list[dict], json_mode: bool = False) -> str
# anonymize.py — runs on every text before it reaches llm.py
def anonymize(text: str, names: list[str]) -> str
# companion.py
async def reply(ctx: PatientContext, user_text: str, risk: RiskResult) -> str
async def checkin_reply(ctx: PatientContext, mood: int, note: str | None) -> str
# summary.py
async def generate_weekly_summary(patient_id: UUID, week_start: date) -> WeeklySummaryContent
# questionnaires.py
def score(kind: str, answers: list[int]) -> tuple[int, str]   # (score, severity)

# ---------- risk/ ----------
@dataclass
class RiskResult:
    level: Literal['green', 'orange', 'red']
    source: Literal['rules', 'llm', 'trend', 'sos', 'questionnaire']
    reason: str

async def assess_message(ctx: PatientContext, text: str) -> RiskResult
    # keyword rules first (instant), then the LLM classifier; returns the higher level
def assess_trend(ctx: PatientContext) -> RiskResult
    # last 7 check-ins; falling mood -> orange
def assess_questionnaire(kind: str, answers: list[int]) -> RiskResult
    # PHQ-9 item 9 = 1 -> orange, >= 2 -> red (team rule, check with a specialist)
async def escalate(ctx: PatientContext, result: RiskResult, message_id: UUID | None) -> EscalationOutcome
    # green: nothing
    # orange: db.create_alert + db.request_urgent_slot
    # red: db.create_alert + email to specialist and emergency contact + crisis payload
def crisis_payload(lang: str) -> Crisis

# ---------- voice/  (postponed) ----------
async def transcribe(audio: bytes, mime: str) -> tuple[str, str]   # (text, language)
async def synthesize(text: str, lang: str) -> bytes               # mp3
```

What `POST /chat` does, in order (Dhia):

1. `db.get_patient_context` loads the patient.
2. `db.save_message` stores the user's message.
3. `risk.assess_message` scores it, and `risk.assess_trend` runs too; the higher level wins.
4. `risk.escalate` acts on that level.
4b. A patient with no specialist (v1.5): no alert is created, but a red message still returns the crisis payload and emails the emergency contact. `POST /sos` answers 409 `no_specialist` and the app opens the crisis screen.
5. On red, `companion.reply` is skipped and the reply is a short fixed message plus the crisis payload. Otherwise `companion.reply` writes the answer.
   Since v1.3 `companion.reply` can call tools (`backend/app/ai/tools.py`): `log_mood`, `start_breathing_exercise`, `start_grounding_exercise`, `start_thought_record`, `get_homework`, `complete_homework`, `get_next_session`, `get_mood_history`. Each tool can add a `ChatAction` card. `log_mood` saves a check-in and re-runs the mood trend and escalation. With the AI off, a keyword fallback still opens the obvious card. On red, no tools run.
6. `db.save_message` stores the AI reply, and the route returns a `ChatReply`.

`POST /checkins` and `POST /questionnaires` follow the same steps 1 to 6, with `assess_questionnaire` used for questionnaires.

## 7. Shared conventions

The same names, formats and errors everywhere, so nobody writes conversion code between layers.

- Naming: `snake_case` in the database, the API JSON and the TypeScript types alike; no camelCase mapping anywhere. Code, comments and commit messages are in English.
- Auth: the frontend logs in with Supabase and sends `Authorization: Bearer <access_token>` on every call. The backend verifies the token with `SUPABASE_JWT_SECRET` and reads the role from `profiles`.
- Formats: ids are UUID strings, timestamps are ISO 8601 in UTC (`2026-11-21T14:30:00Z`), dates are `YYYY-MM-DD`. The frontend shows times in Tunisia time (`Africa/Tunis`).
- Enum values are exactly those in section 4; the frontend never invents new ones.
- Errors always use this body: `{"error": {"code": "not_found", "message": "Appointment not found"}}`, with status 400 bad input, 401 no or bad token, 403 wrong role or not your patient, 404 not found, 409 conflict, 422 validation, 500 server.
- Data: only fake people in `seed.sql` and in the demo. No real names or health data, ever.
- Formatting: `ruff format` for Python and `prettier` for TypeScript, run before every commit.

| Env var | Used by | Example or note |
| --- | --- | --- |
| `SUPABASE_URL` | backend | `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_KEY` | backend | Secret, backend only, never in the frontend |
| `SUPABASE_JWT_SECRET` | backend | Verifies login tokens |
| `GROQ_API_KEY` | backend | One key for chat and Whisper |
| `GROQ_CHAT_MODEL` | backend | Picked by Dhia, the same model for chat and the risk classifier |
| `GROQ_STT_MODEL` | backend | `whisper-large-v3` |
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` | backend | Alert emails (a Gmail app password works) |
| `FRONTEND_ORIGIN` | backend | CORS, e.g. `http://localhost:5173` |
| `VITE_API_URL` | frontend | `http://localhost:8000/api/v1` |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | frontend | Public keys for login and realtime |
| `VITE_USE_MOCKS` | frontend | `true` = use `src/mocks/` instead of the backend |

Real values go in `.env`, which is in `.gitignore`. Share keys in a private team chat, never in the repo.

## 8. Git workflow

There are three kinds of branch: `main` is always demo-ready, `dev` is where work comes together, and each person works on short feature branches off `dev`.

| Branch | Who pushes | Rule |
| --- | --- | --- |
| `main` | Nobody directly | Protected; merged from `dev` only at a checkpoint, after the smoke test passes |
| `dev` | Nobody directly | Protected; gets work through PRs only, merged by Dhia |
| `dhia/risk-engine`, `a/chat-page`, `b/alerts-inbox`… | The owner | One feature or one screen per branch, lives a few hours at most |

For every piece of work:

1. `git pull` on `dev`, then create `<name>/<feature>`.
2. Commit small and often: `feat(chat): add homework to prompt`, `fix(risk): catch darija keywords`. Prefixes are `feat`, `fix`, `chore`, `docs` or `contract`.
3. Before opening a PR, rebase on the latest `dev` and run the app once.
4. Open a PR into `dev`. Dhia reviews and merges A's and B's PRs; A or B click-tests Dhia's frontend PRs. A PR touching a shared file is titled `[contract]` and needs Dhia's OK.
5. Squash-merge, then delete the branch.

Never commit `.env`, API keys, `node_modules/` or `__pycache__/`. If two people need the same file, talk first; the folder owner makes the change.

## 9. Mocks and integration checkpoints

Nobody waits on anybody: everyone builds against fakes that follow this contract, then the team plugs the real parts together at six fixed checkpoints.

- Frontend (A and B): Dhia puts one typed mock file per type in `src/mocks/`, and the functions in `src/api/` return them while `VITE_USE_MOCKS=true`. A and B only call those functions, so their pages never know the difference.
- Backend (Dhia): each function in section 6 starts as a stub with the real signature that returns fake data. Examples: `assess_message` always returns green, `reply` returns `"stub reply"`, `create_alert` prints and returns a fake `Alert`.
- Seed data (B writes, Dhia loads): one specialist, three patients and one week of check-ins, messages and homework. Patient A is stable, patient B has a falling mood and an open orange alert, and patient C is fresh for the live crisis demo.
- Swap rule: replace a stub or a mock with real code in its own PR, and the callers don't change.

The checkpoints are timed as a share of the hackathon's total length. Nothing moves to the next checkpoint until the current one runs end to end on `dev`.

| When | Checkpoint | Must work | Owners |
| --- | --- | --- | --- |
| ~5% | CP0 Contract frozen | Repo skeleton, migration run, keys shared, app runs on every laptop | all |
| ~20% | CP1 Login works | Both roles sign up, onboard and reach their home page on the real backend | Dhia, A, B |
| ~40% | CP2 Chat loop works | Patient sends a message, gets the AI reply, history is saved | Dhia, A |
| ~55% | CP3 Safety works | Crisis message raises a red alert live on the dashboard, email sent, SOS works | Dhia, A, B |
| ~70% | CP4 Weekly loop works | Homework assigned, check-ins logged, weekly summary shown to the specialist | all |
| ~80% | CP5 Feature freeze | Bug fixes only: merge dev into main, rehearse the demo twice, finish the slides | all |

The last 20% after the freeze is buffer for fixes and rehearsal. A checkpoint that slips eats into that buffer, never into the freeze.

## 10. Definition of done

A feature counts as done only when every line below is true. Copy this checklist into each PR description.

- [ ] Paths, field names and types match sections 4 to 6 exactly.
- [ ] It works against the real backend on `dev`, not only against mocks.
- [ ] The error case is handled: a clear message for the user, no crash and no blank screen.
- [ ] Access is tested: patient B cannot see patient A's data, and a specialist sees only their own patients.
- [ ] No secrets or real personal data are in the code or the commits.
- [ ] Dhia reviewed it (A or B click-tested it if it's Dhia's), and it is merged into `dev`.
- [ ] If it appears in the demo, its step is written in `docs/demo-script.md`.
