"""
REAL database: Supabase (Postgres) through the service key. Dhia only.
Used automatically when SUPABASE_URL and SUPABASE_SERVICE_KEY are set.
Same function names and signatures as memory.py (CONTRACT section 6).
The service key bypasses row-level security, so the API routes check access themselves.
"""

from datetime import date, timedelta
from typing import Any, Optional

from supabase import Client, create_client

from app.config import settings
from app.errors import not_found
from app.models import (
    Alert, Appointment, Checkin, Homework, Me, Message, NewAppointmentBody, NewHomeworkBody, PatientContext,
    PatientOnboardingBody, PatientRow, QuestionnaireResult, RiskResult, SessionNote, SessionNoteBody,
    SpecialistOnboardingBody, UpdateAppointmentBody, UpdateHomeworkBody, WeekData, WeeklySummary, WeeklySummaryContent,
)

from .common import RISK_ORDER, build_patient_row, days_from_now, now_iso

_client: Optional[Client] = None


def sb() -> Client:
    global _client
    if _client is None:
        _client = create_client(settings.supabase_url, settings.supabase_service_key)
    return _client


def _first(rows: list[dict]) -> Optional[dict]:
    return rows[0] if rows else None


def _pick(row: dict, model) -> Any:
    return model(**{k: v for k, v in row.items() if k in model.model_fields})


# ---------- profiles ----------
async def get_profile(user_id: str) -> Optional[Me]:
    p = _first(sb().table("profiles").select("*").eq("id", user_id).limit(1).execute().data)
    if not p:
        return None
    pp = _first(sb().table("patient_profiles").select("*").eq("user_id", user_id).limit(1).execute().data) or {}
    return Me(id=p["id"], role=p["role"], nickname=p["nickname"], language=p["language"],
              consent=pp.get("consent"), specialist_id=pp.get("specialist_id"), emergency_name=pp.get("emergency_name"))


async def create_patient_profile(user_id: str, body: PatientOnboardingBody) -> Me:
    sb().table("profiles").upsert({"id": user_id, "role": "patient", "nickname": body.nickname, "language": body.language}).execute()
    # Matching is manual for the hackathon: the patient gets the first specialist in the database.
    spec = _first(sb().table("profiles").select("id").eq("role", "specialist").order("created_at").limit(1).execute().data)
    sb().table("patient_profiles").upsert({
        "user_id": user_id, "specialist_id": spec["id"] if spec else None, "consent": body.consent,
        "emergency_name": body.emergency_name, "emergency_email": body.emergency_email,
    }).execute()
    return await get_profile(user_id)  # type: ignore[return-value]


async def create_specialist_profile(user_id: str, body: SpecialistOnboardingBody) -> Me:
    sb().table("profiles").upsert({"id": user_id, "role": "specialist", "nickname": body.nickname, "language": body.language}).execute()
    sb().table("specialist_profiles").upsert({"user_id": user_id, "specialty": body.specialty, "bio": body.bio}).execute()
    return await get_profile(user_id)  # type: ignore[return-value]


async def update_consent(patient_id: str, consent: str) -> Me:
    sb().table("patient_profiles").update({"consent": consent}).eq("user_id", patient_id).execute()
    return await get_profile(patient_id)  # type: ignore[return-value]


async def is_my_patient(specialist_id: str, patient_id: str) -> bool:
    pp = _first(sb().table("patient_profiles").select("specialist_id").eq("user_id", patient_id).limit(1).execute().data)
    return bool(pp and pp["specialist_id"] == specialist_id)


async def get_patient_context(patient_id: str) -> PatientContext:
    p = _first(sb().table("profiles").select("*").eq("id", patient_id).limit(1).execute().data)
    pp = _first(sb().table("patient_profiles").select("*").eq("user_id", patient_id).limit(1).execute().data)
    if not p or not pp:
        raise not_found("Patient")
    open_hw = sb().table("homework").select("*").eq("patient_id", patient_id).eq("done", False).execute().data
    return PatientContext(
        patient_id=patient_id, nickname=p["nickname"], language=p["language"], consent=pp["consent"],
        specialist_id=pp["specialist_id"], emergency_name=pp["emergency_name"], emergency_email=pp["emergency_email"],
        open_homework=[_pick(h, Homework) for h in open_hw],
        recent_messages=await list_messages(patient_id, 20),
        recent_checkins=(await list_checkins(patient_id))[-7:],
    )


# ---------- appointments ----------
async def list_appointments(user: Me) -> list[Appointment]:
    field = "patient_id" if user.role == "patient" else "specialist_id"
    rows = sb().table("appointments").select("*").eq(field, user.id).order("starts_at").execute().data
    return [_pick(r, Appointment) for r in rows]


async def get_appointment(appointment_id: str) -> Optional[Appointment]:
    r = _first(sb().table("appointments").select("*").eq("id", appointment_id).limit(1).execute().data)
    return _pick(r, Appointment) if r else None


async def create_appointment(specialist_id: str, body: NewAppointmentBody) -> Appointment:
    r = sb().table("appointments").insert({"specialist_id": specialist_id, **body.model_dump()}).execute().data[0]
    return _pick(r, Appointment)


async def update_appointment(appointment_id: str, body: UpdateAppointmentBody) -> Appointment:
    rows = sb().table("appointments").update(body.model_dump(exclude_none=True)).eq("id", appointment_id).execute().data
    if not rows:
        raise not_found("Appointment")
    return _pick(rows[0], Appointment)


async def save_session_note(appointment_id: str, body: SessionNoteBody) -> SessionNote:
    r = sb().table("session_notes").upsert({"appointment_id": appointment_id, **body.model_dump()}, on_conflict="appointment_id").execute().data[0]
    return _pick(r, SessionNote)


async def request_urgent_slot(patient_id: str) -> Optional[Appointment]:
    """Next free slot within 48 h. Simple version: tomorrow 11:00 UTC, unless an urgent one is already scheduled."""
    pp = _first(sb().table("patient_profiles").select("specialist_id").eq("user_id", patient_id).limit(1).execute().data)
    if not pp or not pp["specialist_id"]:
        return None
    existing = _first(sb().table("appointments").select("*").eq("patient_id", patient_id).eq("type", "urgent").eq("status", "scheduled").limit(1).execute().data)
    if existing:
        return _pick(existing, Appointment)
    return await create_appointment(pp["specialist_id"], NewAppointmentBody(patient_id=patient_id, starts_at=days_from_now(1, 11), type="urgent"))


# ---------- homework ----------
async def list_homework(patient_id: str) -> list[Homework]:
    return [_pick(r, Homework) for r in sb().table("homework").select("*").eq("patient_id", patient_id).order("created_at").execute().data]


async def get_homework(homework_id: str) -> Optional[Homework]:
    r = _first(sb().table("homework").select("*").eq("id", homework_id).limit(1).execute().data)
    return _pick(r, Homework) if r else None


async def create_homework(specialist_id: str, body: NewHomeworkBody) -> Homework:
    return _pick(sb().table("homework").insert({"specialist_id": specialist_id, **body.model_dump()}).execute().data[0], Homework)


async def update_homework(homework_id: str, body: UpdateHomeworkBody) -> Homework:
    rows = sb().table("homework").update(body.model_dump(exclude_none=True)).eq("id", homework_id).execute().data
    if not rows:
        raise not_found("Homework")
    return _pick(rows[0], Homework)


# ---------- check-ins and messages ----------
async def save_checkin(patient_id: str, mood: int, note: Optional[str]) -> Checkin:
    return _pick(sb().table("checkins").insert({"patient_id": patient_id, "mood": mood, "note": note}).execute().data[0], Checkin)


async def list_checkins(patient_id: str, date_from: Optional[str] = None, date_to: Optional[str] = None) -> list[Checkin]:
    q = sb().table("checkins").select("*").eq("patient_id", patient_id)
    if date_from:
        q = q.gte("created_at", date_from)
    if date_to:
        q = q.lt("created_at", (date.fromisoformat(date_to) + timedelta(days=1)).isoformat())
    return [_pick(r, Checkin) for r in q.order("created_at").execute().data]


async def save_message(patient_id: str, sender: str, content: str, risk: Optional[str]) -> Message:
    r = sb().table("messages").insert({"patient_id": patient_id, "sender": sender, "content": content, "risk": risk}).execute().data[0]
    return _pick(r, Message)


async def list_messages(patient_id: str, limit: int = 50) -> list[Message]:
    rows = sb().table("messages").select("*").eq("patient_id", patient_id).order("created_at", desc=True).limit(limit).execute().data
    return [_pick(r, Message) for r in reversed(rows)]


# ---------- questionnaires ----------
async def save_questionnaire(patient_id: str, kind: str, answers: list[int], score: int, severity: str) -> QuestionnaireResult:
    r = sb().table("questionnaire_results").insert({"patient_id": patient_id, "kind": kind, "answers": answers, "score": score}).execute().data[0]
    return QuestionnaireResult(id=r["id"], kind=r["kind"], score=r["score"], severity=severity, created_at=r["created_at"])  # type: ignore[arg-type]


async def list_questionnaires(patient_id: str) -> list[QuestionnaireResult]:
    from app.ai.questionnaires import severity_for

    rows = sb().table("questionnaire_results").select("*").eq("patient_id", patient_id).order("created_at").execute().data
    return [QuestionnaireResult(id=r["id"], kind=r["kind"], score=r["score"], severity=severity_for(r["kind"], r["score"]), created_at=r["created_at"]) for r in rows]


# ---------- alerts ----------
def _alert(r: dict) -> Alert:
    nick = _first(sb().table("profiles").select("nickname").eq("id", r["patient_id"]).limit(1).execute().data) or {"nickname": "?"}
    excerpt = None
    if r.get("message_id"):
        m = _first(sb().table("messages").select("content").eq("id", r["message_id"]).limit(1).execute().data)
        excerpt = m["content"][:200] if m else None
    return Alert(
        id=r["id"], patient_id=r["patient_id"], patient_nickname=nick["nickname"], level=r["level"], source=r["source"],
        reason=r["reason"], message_excerpt=excerpt, status=r["status"], created_at=r["created_at"],
    )


async def create_alert(patient_id: str, result: RiskResult, message_id: Optional[str]) -> Alert:
    pp = _first(sb().table("patient_profiles").select("specialist_id").eq("user_id", patient_id).limit(1).execute().data)
    r = sb().table("alerts").insert({
        "patient_id": patient_id, "specialist_id": pp["specialist_id"] if pp else None, "level": result.level,
        "source": result.source, "reason": result.reason, "message_id": message_id,
    }).execute().data[0]
    return _alert(r)


async def list_alerts(specialist_id: str, status: Optional[str] = None) -> list[Alert]:
    q = sb().table("alerts").select("*").eq("specialist_id", specialist_id)
    if status:
        q = q.eq("status", status)
    return [_alert(r) for r in q.order("created_at", desc=True).execute().data]


async def get_alert(alert_id: str) -> Optional[Alert]:
    r = _first(sb().table("alerts").select("*").eq("id", alert_id).limit(1).execute().data)
    return _alert(r) if r else None


async def get_alert_specialist(alert_id: str) -> Optional[str]:
    r = _first(sb().table("alerts").select("specialist_id").eq("id", alert_id).limit(1).execute().data)
    return r["specialist_id"] if r else None


async def update_alert(alert_id: str, status: str) -> Alert:
    rows = sb().table("alerts").update({"status": status}).eq("id", alert_id).execute().data
    if not rows:
        raise not_found("Alert")
    return _alert(rows[0])


# ---------- specialist views ----------
async def list_patients(specialist_id: str) -> list[PatientRow]:
    pps = sb().table("patient_profiles").select("user_id").eq("specialist_id", specialist_id).execute().data
    ids = [p["user_id"] for p in pps]
    if not ids:
        return []
    profiles = {p["id"]: p for p in sb().table("profiles").select("*").in_("id", ids).execute().data}
    since = (date.today() - timedelta(days=7)).isoformat()
    cis = sb().table("checkins").select("*").in_("patient_id", ids).gte("created_at", since).execute().data
    open_alerts = sb().table("alerts").select("*").in_("patient_id", ids).eq("status", "open").execute().data
    appts = sb().table("appointments").select("*").in_("patient_id", ids).eq("status", "scheduled").gte("starts_at", now_iso()).order("starts_at").execute().data
    rows = []
    for pid in ids:
        nxt = next((a["starts_at"] for a in appts if a["patient_id"] == pid), None)
        rows.append(build_patient_row(profiles[pid], [c for c in cis if c["patient_id"] == pid], [a for a in open_alerts if a["patient_id"] == pid], nxt))
    return sorted(rows, key=lambda r: (RISK_ORDER[r.current_risk], r.nickname))


async def get_week_data(patient_id: str, week_start: str) -> WeekData:
    end = (date.fromisoformat(week_start) + timedelta(days=6)).isoformat()
    ctx = await get_patient_context(patient_id)
    msgs: list[Message] = []
    if ctx.consent == "full_chat":
        msgs = [m for m in await list_messages(patient_id, 500) if week_start <= m.created_at[:10] <= end]
    return WeekData(
        patient_id=patient_id, nickname=ctx.nickname, week_start=week_start,
        checkins=await list_checkins(patient_id, week_start, end),
        homework=await list_homework(patient_id),
        questionnaires=[q for q in await list_questionnaires(patient_id) if week_start <= q.created_at[:10] <= end],
        messages=msgs,
    )


async def save_summary(patient_id: str, week_start: str, content: WeeklySummaryContent) -> WeeklySummary:
    r = sb().table("weekly_summaries").upsert(
        {"patient_id": patient_id, "week_start": week_start, "content": content.model_dump()}, on_conflict="patient_id,week_start"
    ).execute().data[0]
    return WeeklySummary(id=r["id"], patient_id=r["patient_id"], week_start=r["week_start"], content=r["content"])


async def list_summaries(patient_id: str) -> list[WeeklySummary]:
    rows = sb().table("weekly_summaries").select("*").eq("patient_id", patient_id).order("week_start", desc=True).execute().data
    return [WeeklySummary(id=r["id"], patient_id=r["patient_id"], week_start=r["week_start"], content=r["content"]) for r in rows]
