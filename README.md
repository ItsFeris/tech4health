# Tech4Health

Mental-health support between therapy sessions: a weekly session with a human specialist, an AI companion the rest of the week, and a safety system that alerts the specialist when it matters.
Built for the **Tech4Health Hackathon** (Mental Healthcare domain).

**New here? Read [START_HERE.md](START_HERE.md).** The full plan is [docs/CONTRACT.md](docs/CONTRACT.md).

## Run it

### Frontend only (mock data, no backend) — what A and B use

```
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 and click **Demo patient** or **Demo specialist**.

### Backend (Python 3.11+)

```
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows   (Mac/Linux: source .venv/bin/activate)
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API docs: http://localhost:8000/docs · Health: http://localhost:8000/health · Tests: `pytest -q`

With an empty `backend/.env` the backend runs in **DEMO mode**: in-memory data, demo logins, canned AI replies.
Copy `backend/.env.example` to `backend/.env` and fill in:

- `GROQ_API_KEY` to turn on the real AI (free at console.groq.com)
- `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` to use the real database (run `supabase/migrations/001_init.sql`, then `002_rls.sql`, in the Supabase SQL editor)

### Frontend + real backend

In `frontend/.env.local`: `VITE_USE_MOCKS=false`. Add `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` for real accounts,
or leave them empty to use the demo buttons against a DEMO-mode backend.

## Stack

React + Vite + TypeScript + Tailwind + shadcn/ui · FastAPI · Supabase (Postgres, Auth, Realtime) · Groq (Llama) — all free tiers.
