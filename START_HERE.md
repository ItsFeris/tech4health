# Start here 👋

Welcome to the Tech4Health team. Read this once (5 minutes), then let your AI assistant do the rest.

## Who does what

| You are | You build |
| --- | --- |
| **Dhia** | Backend, database, risk engine, the app skeleton, merging everyone's work |
| **A** | Tests the patient app on real phones, reports bugs, small fixes with Dhia's OK, rehearses the patient side of the demo |
| **B** | Content: AI prompts, crisis keywords, crisis screen text, demo patients, demo script, slides |

All screens are already built from the design file. You don't need to build screens.

The full plan is in [`docs/CONTRACT.md`](docs/CONTRACT.md). Your AI reads it for you.

## First time setup (once)

1. Accept the GitHub invite to this repo.
2. Install [Git](https://git-scm.com/downloads), [Node.js LTS](https://nodejs.org) and an AI editor
   (Cursor, Windsurf, or VS Code with Copilot / Claude Code).
3. Clone the repo and open the folder in your editor:
   ```
   git clone https://github.com/ItsFeris/tech4health.git
   ```
4. Wait until Dhia says the skeleton is ready (the `frontend/` folder exists).
5. Then, inside the `frontend` folder:
   ```
   npm install
   npm run dev
   ```
   Open the link it prints (usually http://localhost:5173).

## Every time you build a screen

1. Get the latest code and make a branch (replace `a` with `b` if you're B):
   ```
   git checkout dev
   git pull
   git checkout -b a/chat-page
   ```
2. Tell your AI, in its chat:
   > Read AGENTS.md and docs/CONTRACT.md. I am **A** (patient app). Build the **chat page**: [what it should do].
3. Check the screen in the browser. Blank page or red error = ask the AI to fix it before moving on.
4. Save and send your work:
   ```
   git add .
   git commit -m "feat: chat page"
   git push -u origin a/chat-page
   ```
5. On GitHub, click **Compare & pull request** → base: `dev` → **Create pull request**. Tell Dhia.

## The 3 golden rules

1. **Stay in your folder.** A = `frontend/src/pages/patient/`, B = `frontend/src/pages/specialist/` (+ `docs/` and the prompt files).
2. **Never change** `contract.ts`, `src/api/`, `src/mocks/` or `backend/`. If the AI wants to, say no and ask Dhia.
3. **One screen at a time**, then commit. Small steps = nothing breaks.

Stuck for more than 15 minutes? Message Dhia with a screenshot of the error.
