"""Weekly summary for the specialist. Numbers are computed here; the LLM only writes the short text parts."""

import json

from app import db
from app.models import SummaryHomework, WeekData, WeeklySummaryContent

from . import llm
from .anonymize import anonymize
from .prompts import load


def _trend(moods: list[int]) -> str:
    if len(moods) < 3:
        return "stable"
    half = len(moods) // 2
    first, last = sum(moods[:half]) / half, sum(moods[half:]) / (len(moods) - half)
    return "improving" if last - first >= 0.75 else "declining" if first - last >= 0.75 else "stable"


async def generate_weekly_summary(patient_id: str, week_start: str) -> WeeklySummaryContent:
    return await summarize(await db.get_week_data(patient_id, week_start))


async def summarize(data: WeekData) -> WeeklySummaryContent:
    """Pure function of the week's data (no database), so the /dev test page can call it too."""
    moods = [c.mood for c in data.checkins]
    base = {
        "mood_trend": _trend(moods),
        "mood_avg": round(sum(moods) / len(moods), 1) if moods else None,
        "homework": [SummaryHomework(title=h.title, done=h.done) for h in data.homework],
    }
    facts = {
        "checkins": [{"day": c.created_at[:10], "mood": c.mood, "note": anonymize(c.note or "", [data.nickname])} for c in data.checkins],
        "homework": [{"title": h.title, "done": h.done} for h in data.homework],
        "questionnaires": [{"kind": q.kind, "score": q.score, "severity": q.severity} for q in data.questionnaires],
        "chat_messages": [anonymize(m.content, [data.nickname]) for m in data.messages if m.sender == "user"][-30:],
    }
    out = await llm.chat_json([{"role": "system", "content": load("summary.md")}, {"role": "user", "content": json.dumps(facts, ensure_ascii=False)}], max_tokens=500)
    if not out:  # no AI: simple rule-based text
        notes = [f"{c['day']}: {c['note']}" for c in facts["checkins"] if c["note"]]
        out = {
            "key_events": notes[:4] or [f"{len(moods)} check-ins this week"],
            "concerns": (["Mood is going down"] if base["mood_trend"] == "declining" else []) + [f"Homework not done: {h.title}" for h in data.homework if not h.done][:2],
            "prep_topic": None,
        }
    return WeeklySummaryContent(
        **base,
        key_events=[str(x) for x in out.get("key_events", [])][:4],
        concerns=[str(x) for x in out.get("concerns", [])][:3],
        prep_topic=out.get("prep_topic") or None,
    )
