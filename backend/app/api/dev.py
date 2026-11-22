"""
Test endpoints for the /dev page. Dhia only. Enabled only when DEV_TOOLS=true in backend/.env.
They run the real AI, risk engine and summary code on data you type in.
Nothing is saved to the database and no alert or email is sent.
"""

import time
import uuid
from typing import Literal, Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app import db
from app.ai import companion, llm, prompts
from app.ai.tools import ToolRun
from app.ai.summary import summarize
from app.config import settings
from app.models import Checkin, Homework, Lang, Message, PatientContext, RiskResult, WeekData
from app.risk import engine
from app.risk.escalate import crisis_payload

router = APIRouter(prefix="/dev", tags=["dev (test page)"])


def _ms(t0: float) -> int:
    return int((time.perf_counter() - t0) * 1000)


def _now() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


class Turn(BaseModel):
    sender: Literal["user", "ai"]
    content: str


class Persona(BaseModel):
    nickname: str = "Yasmine"
    language: Lang = "darija"
    homework: list[str] = []
    moods: list[int] = Field(default=[], description="Recent check-ins, oldest first, 1-5")


def _ctx(p: Persona, history: list[Turn]) -> PatientContext:
    return PatientContext(
        patient_id="dev", nickname=p.nickname, language=p.language, consent="summary_only", specialist_id="dev-specialist",
        open_homework=[Homework(id=str(uuid.uuid4()), patient_id="dev", title=t) for t in p.homework if t.strip()],
        recent_messages=[Message(id=str(uuid.uuid4()), sender=h.sender, content=h.content, created_at=_now()) for h in history][-20:],
        recent_checkins=[Checkin(id=str(uuid.uuid4()), mood=m, created_at=_now()) for m in p.moods if 1 <= m <= 5][-7:],
    )


WOULD_DO = {
    "green": "Nothing: the AI just replies.",
    "orange": "Create an orange alert for the specialist + book an urgent session within 48 h.",
    "red": "Create a red alert (live on the dashboard) + email the emergency contact + show the crisis screen. The AI reply is replaced by the crisis text.",
}


@router.get("/info")
async def info():
    kw = engine.keywords()
    return {
        "database": db.BACKEND,
        "ai": "groq" if llm.enabled() else "off (canned replies)",
        "model": settings.groq_chat_model,
        "keywords": {"red": len(kw["red"]), "orange": len(kw["orange"])},
        "prompts": {name: prompts.load(name) for name in ("companion.md", "risk_classifier.md", "summary.md")},
    }


@router.post("/reload")
async def reload():
    """Apply edits to prompts/*.md, crisis.json and keywords.txt without restarting."""
    prompts.reload_all()
    engine.keywords.cache_clear()
    return await info()


class ChatTry(Persona):
    text: str = Field(min_length=1)
    history: list[Turn] = []


@router.post("/chat")
async def try_chat(body: ChatTry):
    ctx = _ctx(body, body.history)
    t0 = time.perf_counter()
    rules = engine.assess_rules(body.text)
    t_llm = time.perf_counter()
    ai_check = await engine.assess_llm(ctx, body.text)
    llm_ms = _ms(t_llm)
    trend = engine.assess_trend(ctx)
    final = engine.highest(rules, ai_check, trend)
    crisis = crisis_payload(ctx.language) if final.level == "red" else None
    t_reply = time.perf_counter()
    run = ToolRun(ctx=ctx, dry_run=True)  # tools run for real reads, but nothing is saved
    reply = crisis.body if crisis else await companion.reply(ctx, body.text, final, tools=run)
    return {
        "reply": reply,
        "actions": run.actions,
        "tool_calls": run.calls,
        "risk": {"rules": rules, "llm": ai_check, "trend": trend, "final": final},
        "would_do": WOULD_DO[final.level],
        "crisis": crisis,
        "timing_ms": {"risk_ai_check": llm_ms, "reply": _ms(t_reply), "total": _ms(t0)},
        "ai_error": llm.last_error,
    }


class RiskTry(BaseModel):
    text: str = Field(min_length=1)
    history: list[Turn] = []


@router.post("/risk")
async def try_risk(body: RiskTry):
    ctx = _ctx(Persona(), body.history)
    t0 = time.perf_counter()
    rules = engine.assess_rules(body.text)
    ai_check = await engine.assess_llm(ctx, body.text)
    final = engine.highest(rules, ai_check)
    return {"rules": rules, "llm": ai_check, "final": final, "would_do": WOULD_DO[final.level], "timing_ms": _ms(t0), "ai_error": llm.last_error}


class CheckinTry(Persona):
    mood: int = Field(ge=1, le=5)
    note: Optional[str] = None


@router.post("/checkin")
async def try_checkin(body: CheckinTry):
    ctx = _ctx(Persona(**body.model_dump(exclude={"mood", "note", "moods"}), moods=[*body.moods, body.mood]), [])
    t0 = time.perf_counter()
    risk: RiskResult = engine.highest(engine.assess_trend(ctx), engine.assess_rules(body.note) if body.note else engine.GREEN)
    if body.note and risk.level != "red":
        risk = engine.highest(risk, await engine.assess_llm(ctx, body.note))
    reply = crisis_payload(ctx.language).body if risk.level == "red" else await companion.checkin_reply(ctx, body.mood, body.note)
    return {"reply": reply, "risk": risk, "would_do": WOULD_DO[risk.level], "timing_ms": _ms(t0), "ai_error": llm.last_error}


class DayIn(BaseModel):
    day: str
    mood: int = Field(ge=1, le=5)
    note: Optional[str] = None


class HomeworkIn(BaseModel):
    title: str
    done: bool = False


class SummaryTry(BaseModel):
    nickname: str = "Karim"
    week_start: str
    checkins: list[DayIn]
    homework: list[HomeworkIn] = []
    messages: list[str] = []


@router.post("/summary")
async def try_summary(body: SummaryTry):
    data = WeekData(
        patient_id="dev", nickname=body.nickname, week_start=body.week_start,
        checkins=[Checkin(id=str(i), mood=d.mood, note=d.note, created_at=f"{d.day}T20:00:00Z") for i, d in enumerate(body.checkins)],
        homework=[Homework(id=str(i), patient_id="dev", title=h.title, done=h.done) for i, h in enumerate(body.homework)],
        questionnaires=[],
        messages=[Message(id=str(i), sender="user", content=m, created_at=f"{body.week_start}T12:00:00Z") for i, m in enumerate(body.messages)],
    )
    t0 = time.perf_counter()
    content = await summarize(data)
    return {"summary": content, "timing_ms": _ms(t0), "ai_error": llm.last_error}
