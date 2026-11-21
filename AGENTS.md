# AGENTS.md — instructions for any AI coding assistant in this repo

You are helping a team of 3 build **Tech4Health**, a hackathon mental-health platform:
patients chat with an AI companion between weekly sessions with a human specialist,
a risk engine flags danger, and the specialist sees alerts and a weekly summary.

**The source of truth is `docs/CONTRACT.md`.** Read it before writing code.
Its types, endpoint paths, field names and enum values are frozen. Never invent or rename them.

## Step 1 — find out who you are helping

Ask the user which role they have, unless the git branch already tells you
(`dhia/...`, `a/...`, `b/...`):

| Role | Person | You may edit ONLY | Never edit |
| --- | --- | --- | --- |
| Lead + backend | Dhia | everything | — |
| A — Patient app | teammate A | `frontend/src/pages/patient/`, new files in `frontend/src/components/` | everything else |
| B — Specialist side + content | teammate B | `frontend/src/pages/specialist/`, new files in `frontend/src/components/`, `docs/`, `backend/app/ai/prompts/`, `backend/app/risk/keywords.txt`, `supabase/seed.sql` | everything else |

For A and B these files are **read-only, always**: `frontend/src/types/contract.ts`,
`frontend/src/api/`, `frontend/src/mocks/`, `backend/` (except B's two content paths),
`package.json`, config files, `.env*`.
If a task seems to need a change there, STOP and tell the user: "This needs Dhia."

## Step 2 — check the setup exists

If `frontend/src/api/` or `frontend/src/types/contract.ts` does not exist yet,
Dhia has not finished the skeleton. Tell the user to wait for it. Do not create them yourself
unless the user is Dhia.

## Rules for frontend work (A and B)

- Stack: React + Vite + TypeScript + Tailwind + shadcn/ui. Do not add other UI libraries.
- Get data ONLY by calling the functions exported from `frontend/src/api/`.
  Never call `fetch`, axios or Supabase directly from a page.
- Use the types from `frontend/src/types/contract.ts` exactly as they are.
- Work on ONE screen per task. Create one page file, plus small components if needed.
- Every screen needs a loading state, an error message, and an empty state.
- Mobile-friendly layout. Simple, calm design: this is a mental-health app.
- Mocks are on by default (`VITE_USE_MOCKS=true`), so screens work without the backend.
  Log in with the **Demo patient** / **Demo specialist** buttons.
- Reuse what already exists instead of writing your own:
  - UI pieces in `frontend/src/components/ui/` (Button, Card, Input, Textarea, Badge, Label). Badge has `green` / `orange` / `red` variants for risk.
  - `useAsync` from `@/hooks/useAsync` for loading data: `const { data, error, loading, reload } = useAsync(() => getHomework(), [])`
  - `Spinner`, `ErrorView`, `EmptyView` from `@/components/StateViews` for the loading / error / empty states.
  - `useAuth()` from `@/auth/AuthContext` for the logged-in user (`me`) and `refresh()`.
- Every page file starts as a placeholder that lists what to build and which functions to call. Replace the whole file.
- Routes already exist in `App.tsx` for every planned screen. A new route needs Dhia.
- Run `npm run dev` inside `frontend/` and check the screen in the browser before saying it's done.

## Rules for content work (B)

- Prompts go in `backend/app/ai/prompts/*.md`, plain text, one file per prompt.
- Crisis keywords go in `backend/app/risk/keywords.txt`, one word or phrase per line,
  in Tunisian darija (Arabic and Latin script), Arabic, French and English.
- Seed data and demo patients are always fake. No real names or real health information.

## Safety rules (everyone)

- The AI companion supports; it never diagnoses, never names a condition, never suggests medication.
- Crisis screens show the text from B's content files. Do not write your own emergency numbers.
- Never commit `.env`, API keys or tokens. Never put real personal data anywhere in the repo.

## Git workflow

1. Start from the latest `dev`: `git checkout dev` then `git pull`.
2. Create a branch named for the person and the screen: `a/chat-page`, `b/alerts-inbox`, `dhia/risk-engine`.
3. Commit after each working screen: `git add .` then `git commit -m "feat(chat): chat page with mocks"`.
4. `git push -u origin <branch>` and open a Pull Request into `dev` on GitHub. Dhia reviews and merges.
5. Never push to `main` or `dev` directly.

## When you finish a task, tell the user

- Which files you created or changed (they must all be inside their allowed folders).
- How to see the result (which URL in the browser).
- The exact git commands to commit and push it.
