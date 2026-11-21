# Copilot instructions

Before doing anything, read `AGENTS.md` at the repo root and `docs/CONTRACT.md`, and follow them exactly.

Key rules (full version in AGENTS.md):

- Ask the user if they are Dhia, A (patient app) or B (specialist side + content), unless the branch name says it.
- A edits only `frontend/src/pages/patient/`. B edits only `frontend/src/pages/specialist/`, `docs/`, `backend/app/ai/prompts/`, `backend/app/risk/keywords.txt`, `supabase/seed.sql`. Both may add new files in `frontend/src/components/`.
- Never edit `frontend/src/types/contract.ts`, `frontend/src/api/`, `frontend/src/mocks/` or `backend/` unless the user is Dhia. If needed, say "This needs Dhia."
- Pages get data only through functions in `frontend/src/api/`, using the types in `contract.ts` unchanged.
- One screen per task, with loading, error and empty states. React + Vite + TypeScript + Tailwind + shadcn/ui only.
- Never diagnose or suggest medication in app text. Never commit `.env`, keys or real personal data.
