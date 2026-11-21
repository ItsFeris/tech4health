# Prompts — owned by B

These files decide how the AI talks. B edits them; Dhia's code loads them. No coding needed.

| File | What it is | Rules |
| --- | --- | --- |
| `companion.md` | The AI companion's personality and rules (system prompt) | Keep the `{placeholders}` exactly as they are |
| `summary.md` | How the weekly summary for the specialist is written | Must keep asking for the same JSON keys |
| `risk_classifier.md` | How the AI judges if a message is green / orange / red | Must keep asking for `{"level", "reason"}` JSON |
| `crisis.json` | Text of the crisis screen, per language | Keep the same keys; must stay valid JSON |

Also yours: `backend/app/risk/keywords.txt` (crisis words) and `supabase/seed.sql` (fake demo patients).

Test a change: restart the backend, send a chat message from the patient app, read the reply.
