"""
Tools Nour (the AI companion) can call during a chat. Dhia only.
The model decides when to call them; this file defines what each tool does.

Every tool acts ONLY on the current patient. Tools never give medical advice and never touch other patients.
Each call adds a ChatAction that the app shows as a card under Nour's reply.
dry_run=True (the /dev test page) runs everything without writing to the database.
"""

import json
import logging
import re
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from app import db
from app.models import Appointment, ChatAction, Checkin, PatientContext

log = logging.getLogger("t4h.tools")

# ---------- what the model sees (OpenAI / Groq tool format) ----------
SPECS: list[dict] = [
    {
        "type": "function",
        "function": {
            "name": "log_mood",
            "description": "Save the user's mood as today's check-in. Use when they clearly say how they feel overall today (or ask you to log it). Ask first if the mood is unclear.",
            "parameters": {
                "type": "object",
                "properties": {
                    "mood": {"type": "integer", "minimum": 1, "maximum": 5, "description": "1 very low, 2 low, 3 okay, 4 good, 5 great"},
                    "note": {"type": "string", "description": "A few words about why, in the user's words (optional)"},
                },
                "required": ["mood"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "start_breathing_exercise",
            "description": "Open a guided breathing exercise in the chat. Use for stress, anxiety, panic, anger or trouble sleeping, or when the user asks to breathe.",
            "parameters": {
                "type": "object",
                "properties": {
                    "pattern": {"type": "string", "enum": ["box", "478", "slow"], "description": "box = 4-4-4-4 (calm focus), 478 = 4-7-8 (sleep, strong anxiety), slow = 4 in 6 out (general calm)"},
                    "cycles": {"type": "integer", "minimum": 3, "maximum": 10},
                },
                "required": ["pattern"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "start_grounding_exercise",
            "description": "Open the 5-4-3-2-1 grounding exercise (5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste). Use when the user feels overwhelmed, panicky, dissociated or stuck in racing thoughts.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "start_thought_record",
            "description": "Open a CBT thought record so the user can examine a negative thought: situation, automatic thought, emotion and intensity, evidence for and against, balanced thought. Use when they are stuck on a harsh or catastrophic thought about themselves.",
            "parameters": {
                "type": "object",
                "properties": {"situation": {"type": "string", "description": "Short description of the situation they mentioned, in their words"}},
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_homework",
            "description": "Show the homework the specialist gave this week, with what is done and not done.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "complete_homework",
            "description": "Mark one homework task as done when the user says they did it. Use the exact title from get_homework or from the context.",
            "parameters": {"type": "object", "properties": {"title": {"type": "string"}}, "required": ["title"]},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_next_session",
            "description": "Show when the user's next session with their specialist is.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_mood_history",
            "description": "Show the user's recent daily moods, to notice patterns together (e.g. 'your mood was better on days you walked').",
            "parameters": {"type": "object", "properties": {"days": {"type": "integer", "minimum": 3, "maximum": 14}}},
        },
    },
]

NAMES = {s["function"]["name"] for s in SPECS}
MOOD_WORDS = ["", "very low", "low", "okay", "good", "great"]


@dataclass
class ToolRun:
    """State of one chat turn: who we act for, and what the tools did."""

    ctx: PatientContext
    dry_run: bool = False
    actions: list[ChatAction] = field(default_factory=list)
    calls: list[dict] = field(default_factory=list)  # for the /dev page: name, args, result
    urgent_appointment: Optional[Appointment] = None
    alert_raised: bool = False


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


async def execute(name: str, args: dict[str, Any], run: ToolRun) -> dict:
    """Run one tool and return a short JSON-able result for the model."""
    try:
        result = await _execute(name, args or {}, run)
    except Exception as e:  # a tool must never break the chat
        log.warning("tool %s failed: %s", name, e)
        result = {"ok": False, "error": "This tool is unavailable right now."}
    run.calls.append({"name": name, "args": args, "result": result})
    return result


async def _execute(name: str, a: dict, run: ToolRun) -> dict:
    ctx = run.ctx
    if name == "start_breathing_exercise":
        pattern = a.get("pattern") if a.get("pattern") in ("box", "478", "slow") else "slow"
        cycles = max(3, min(10, int(a.get("cycles") or 4)))
        run.actions.append(ChatAction(type="breathing", pattern=pattern, cycles=cycles))
        return {"ok": True, "shown": f"{pattern} breathing, {cycles} cycles"}

    if name == "start_grounding_exercise":
        run.actions.append(ChatAction(type="grounding"))
        return {"ok": True, "shown": "5-4-3-2-1 grounding"}

    if name == "start_thought_record":
        situation = (a.get("situation") or "").strip()[:300] or None
        run.actions.append(ChatAction(type="thought_record", situation=situation))
        return {"ok": True, "shown": "thought record form"}

    if name == "log_mood":
        mood = int(a.get("mood", 0))
        if not 1 <= mood <= 5:
            return {"ok": False, "error": "mood must be 1 to 5"}
        note = (a.get("note") or "").strip()[:300] or None
        if run.dry_run:
            checkin = Checkin(id=str(uuid.uuid4()), mood=mood, note=note, created_at=_now())
        else:
            from app.risk import engine
            from app.risk.escalate import escalate

            checkin = await db.save_checkin(ctx.patient_id, mood, note)
            fresh = await db.get_patient_context(ctx.patient_id)
            trend = engine.assess_trend(fresh)
            if trend.level != "green":
                outcome = await escalate(fresh, trend, None)
                run.urgent_appointment = outcome.urgent_appointment or run.urgent_appointment
                run.alert_raised = bool(outcome.alert)
        run.actions.append(ChatAction(type="mood_logged", checkin=checkin))
        return {"ok": True, "saved": f"{mood}/5 ({MOOD_WORDS[mood]})", "specialist_alerted": run.alert_raised}

    if name == "get_homework":
        items = ctx.open_homework if run.dry_run else await db.list_homework(ctx.patient_id)
        run.actions.append(ChatAction(type="homework_list", homework=items))
        return {"ok": True, "homework": [{"title": h.title, "done": h.done, "due": h.due_date} for h in items]}

    if name == "complete_homework":
        title = (a.get("title") or "").strip().lower()
        items = ctx.open_homework if run.dry_run else await db.list_homework(ctx.patient_id)
        match = next((h for h in items if h.title.lower() == title), None) or next((h for h in items if title and (title in h.title.lower() or h.title.lower() in title)), None)
        if not match:
            return {"ok": False, "error": "No homework with that title", "titles": [h.title for h in items]}
        if not run.dry_run and not match.done:
            from app.models import UpdateHomeworkBody

            match = await db.update_homework(match.id, UpdateHomeworkBody(done=True))
        else:
            match = match.model_copy(update={"done": True})
        run.actions.append(ChatAction(type="homework_done", homework=[match]))
        return {"ok": True, "done": match.title}

    if name == "get_next_session":
        if run.dry_run:
            appt = None
        else:
            from app.models import Me

            me = Me(id=ctx.patient_id, role="patient", nickname=ctx.nickname, language=ctx.language)
            now = _now()
            upcoming = [x for x in await db.list_appointments(me) if x.status == "scheduled" and x.starts_at >= now]
            appt = upcoming[0] if upcoming else None
        run.actions.append(ChatAction(type="next_session", appointment=appt))
        return {"ok": True, "next_session": appt.starts_at if appt else None, "type": appt.type if appt else None}

    if name == "get_mood_history":
        days = max(3, min(14, int(a.get("days") or 7)))
        if run.dry_run:
            moods = ctx.recent_checkins
        else:
            since = (datetime.now(timezone.utc) - timedelta(days=days)).date().isoformat()
            moods = await db.list_checkins(ctx.patient_id, since)
        run.actions.append(ChatAction(type="mood_history", moods=moods[-14:]))
        return {"ok": True, "moods": [{"day": c.created_at[:10], "mood": c.mood, "note": c.note} for c in moods[-14:]]}

    return {"ok": False, "error": f"unknown tool {name}"}


# ---------- when the AI is off: obvious requests still work ----------
_INTENTS: list[tuple[re.Pattern, str, dict]] = [
    (re.compile(r"breath|respir|netneffs|تنفس|نتنفس", re.I), "start_breathing_exercise", {"pattern": "slow"}),
    (re.compile(r"ground|5-4-3-2-1|ancrage", re.I), "start_grounding_exercise", {}),
    (re.compile(r"thought record|pens[ée]e n[ée]gative", re.I), "start_thought_record", {}),
    (re.compile(r"homework|devoir|exercices? de la semaine|wejbet", re.I), "get_homework", {}),
    (re.compile(r"next session|prochaine s[ée]ance|rendez-vous|maw3ed", re.I), "get_next_session", {}),
]


async def run_intents(text: str, run: ToolRun) -> None:
    for pattern, name, args in _INTENTS:
        if pattern.search(text):
            await execute(name, args, run)
            return


def parse_args(raw: Optional[str]) -> dict:
    try:
        v = json.loads(raw or "{}")
        return v if isinstance(v, dict) else {}
    except json.JSONDecodeError:
        return {}
