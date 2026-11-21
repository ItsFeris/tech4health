"""
DEMO database: everything lives in memory and resets when the server restarts.
Used automatically when SUPABASE_URL / SUPABASE_SERVICE_KEY are empty. Dhia only.
Same function names and signatures as supabase_repo.py (CONTRACT section 6).
"""

from typing import Optional

from app.errors import not_found
from app.models import (
    Alert, Appointment, Checkin, Homework, Me, Message, NewAppointmentBody, NewHomeworkBody, PatientContext,
    PatientOnboardingBody, PatientRow, QuestionnaireResult, RiskResult, SessionNote, SessionNoteBody,
    SpecialistOnboardingBody, UpdateAppointmentBody, UpdateHomeworkBody, WeekData, WeeklySummary, WeeklySummaryContent,
)

from .common import RISK_ORDER, build_patient_row, days_from_now, new_id, now_iso

# ---------- demo users (same ids as frontend/src/mocks/ids.ts) ----------
SPECIALIST_ID = "00000000-0000-4000-8000-000000000001"
PATIENT_A_ID = "00000000-0000-4000-8000-0000000000a1"
PATIENT_B_ID = "00000000-0000-4000-8000-0000000000b1"
PATIENT_C_ID = "00000000-0000-4000-8000-0000000000c1"
DEMO_TOKENS = {"demo-patient": PATIENT_C_ID, "demo-specialist": SPECIALIST_ID}

profiles: dict[str, dict] = {}
patient_profiles: dict[str, dict] = {}
appointments: dict[str, dict] = {}
notes: dict[str, dict] = {}
homework: dict[str, dict] = {}
checkins: dict[str, dict] = {}
messages: dict[str, dict] = {}
questionnaires: dict[str, dict] = {}
alerts: dict[str, dict] = {}
summaries: dict[str, dict] = {}


def _seed() -> None:
    profiles[SPECIALIST_ID] = {"id": SPECIALIST_ID, "role": "specialist", "nickname": "Dr. Amira", "language": "fr"}
    for pid, name, lang in [(PATIENT_A_ID, "Mehdi", "fr"), (PATIENT_B_ID, "Karim", "darija"), (PATIENT_C_ID, "Yasmine", "darija")]:
        profiles[pid] = {"id": pid, "role": "patient", "nickname": name, "language": lang}
        patient_profiles[pid] = {
            "user_id": pid, "specialist_id": SPECIALIST_ID, "consent": "summary_only",
            "emergency_name": "Sami (brother)" if pid == PATIENT_C_ID else None,
            "emergency_email": "family@example.com" if pid == PATIENT_C_ID else None,
        }
    for pid, days, hour, kind in [(PATIENT_C_ID, 3, 15, "weekly"), (PATIENT_A_ID, 2, 9, "weekly"), (PATIENT_B_ID, 1, 11, "urgent")]:
        aid = new_id()
        appointments[aid] = {"id": aid, "patient_id": pid, "specialist_id": SPECIALIST_ID, "starts_at": days_from_now(days, hour), "type": kind, "status": "scheduled"}
    for pid, title, done in [
        (PATIENT_C_ID, "5-minute breathing, every evening", False),
        (PATIENT_C_ID, "Write down 3 good things each day", True),
        (PATIENT_A_ID, "Walk 20 minutes outside", True),
        (PATIENT_B_ID, "Sleep diary", False),
    ]:
        hid = new_id()
        homework[hid] = {"id": hid, "patient_id": pid, "specialist_id": SPECIALIST_ID, "title": title, "description": None, "due_date": days_from_now(3)[:10], "done": done}
    for pid, moods in [(PATIENT_A_ID, [3, 4, 4, 3, 4, 4, 5]), (PATIENT_B_ID, [4, 3, 3, 2, 2, 1, 2]), (PATIENT_C_ID, [3, 3, 2, 3, 4, 3, 3])]:
        for i, m in enumerate(moods):
            cid = new_id()
            checkins[cid] = {"id": cid, "patient_id": pid, "mood": m, "note": None, "created_at": days_from_now(i - 6, 20)}
    alert_id = new_id()
    alerts[alert_id] = {
        "id": alert_id, "patient_id": PATIENT_B_ID, "specialist_id": SPECIALIST_ID, "level": "orange", "source": "trend",
        "reason": "Mood fell from 4 to 1-2 over the last 5 days.", "message_id": None, "status": "open", "created_at": days_from_now(-1, 21),
    }


_seed()


# ---------- helpers ----------
def _me(user_id: str) -> Me:
    p = profiles[user_id]
    extra = patient_profiles.get(user_id, {})
    return Me(**p, consent=extra.get("consent"), specialist_id=extra.get("specialist_id"), emergency_name=extra.get("emergency_name"))


def _alert(a: dict) -> Alert:
    msg = messages.get(a["message_id"] or "")
    return Alert(
        **{k: a[k] for k in ("id", "patient_id", "level", "source", "reason", "status", "created_at")},
        patient_nickname=profiles[a["patient_id"]]["nickname"],
        message_excerpt=msg["content"][:200] if msg else None,
    )


def _sorted(rows, key="created_at"):
    return sorted(rows, key=lambda r: r[key])


# ---------- profiles ----------
async def get_profile(user_id: str) -> Optional[Me]:
    return _me(user_id) if user_id in profiles else None


async def create_patient_profile(user_id: str, body: PatientOnboardingBody) -> Me:
    profiles[user_id] = {"id": user_id, "role": "patient", "nickname": body.nickname, "language": body.language}
    patient_profiles[user_id] = {
        "user_id": user_id, "specialist_id": SPECIALIST_ID, "consent": body.consent,
        "emergency_name": body.emergency_name, "emergency_email": body.emergency_email,
    }
    return _me(user_id)


async def create_specialist_profile(user_id: str, body: SpecialistOnboardingBody) -> Me:
    profiles[user_id] = {"id": user_id, "role": "specialist", "nickname": body.nickname, "language": body.language}
    return _me(user_id)


async def update_consent(patient_id: str, consent: str) -> Me:
    patient_profiles[patient_id]["consent"] = consent
    return _me(patient_id)


async def is_my_patient(specialist_id: str, patient_id: str) -> bool:
    return patient_profiles.get(patient_id, {}).get("specialist_id") == specialist_id


async def get_patient_context(patient_id: str) -> PatientContext:
    p, pp = profiles[patient_id], patient_profiles[patient_id]
    return PatientContext(
        patient_id=patient_id, nickname=p["nickname"], language=p["language"], consent=pp["consent"],
        specialist_id=pp["specialist_id"], emergency_name=pp["emergency_name"], emergency_email=pp["emergency_email"],
        open_homework=[Homework(**h) for h in homework.values() if h["patient_id"] == patient_id and not h["done"]],
        recent_messages=await list_messages(patient_id, 20),
        recent_checkins=(await list_checkins(patient_id))[-7:],
    )


# ---------- appointments ----------
async def list_appointments(user: Me) -> list[Appointment]:
    field = "patient_id" if user.role == "patient" else "specialist_id"
    return [Appointment(**a) for a in _sorted([a for a in appointments.values() if a[field] == user.id], "starts_at")]


async def get_appointment(appointment_id: str) -> Optional[Appointment]:
    a = appointments.get(appointment_id)
    return Appointment(**a) if a else None


async def create_appointment(specialist_id: str, body: NewAppointmentBody) -> Appointment:
    aid = new_id()
    appointments[aid] = {"id": aid, "specialist_id": specialist_id, "status": "scheduled", **body.model_dump()}
    return Appointment(**appointments[aid])


async def update_appointment(appointment_id: str, body: UpdateAppointmentBody) -> Appointment:
    if appointment_id not in appointments:
        raise not_found("Appointment")
    appointments[appointment_id].update(body.model_dump(exclude_none=True))
    return Appointment(**appointments[appointment_id])


async def save_session_note(appointment_id: str, body: SessionNoteBody) -> SessionNote:
    notes[appointment_id] = {"appointment_id": appointment_id, **body.model_dump()}
    return SessionNote(**notes[appointment_id])


async def request_urgent_slot(patient_id: str) -> Optional[Appointment]:
    """Next free slot within 48 h. Demo: tomorrow at 11:00 UTC, unless an urgent one is already scheduled."""
    spec = patient_profiles[patient_id]["specialist_id"]
    if not spec:
        return None
    for a in appointments.values():
        if a["patient_id"] == patient_id and a["type"] == "urgent" and a["status"] == "scheduled":
            return Appointment(**a)
    return await create_appointment(spec, NewAppointmentBody(patient_id=patient_id, starts_at=days_from_now(1, 11), type="urgent"))


# ---------- homework ----------
async def list_homework(patient_id: str) -> list[Homework]:
    return [Homework(**h) for h in homework.values() if h["patient_id"] == patient_id]


async def get_homework(homework_id: str) -> Optional[Homework]:
    h = homework.get(homework_id)
    return Homework(**h) if h else None


async def create_homework(specialist_id: str, body: NewHomeworkBody) -> Homework:
    hid = new_id()
    homework[hid] = {"id": hid, "specialist_id": specialist_id, "done": False, **body.model_dump()}
    return Homework(**homework[hid])


async def update_homework(homework_id: str, body: UpdateHomeworkBody) -> Homework:
    if homework_id not in homework:
        raise not_found("Homework")
    homework[homework_id].update(body.model_dump(exclude_none=True))
    return Homework(**homework[homework_id])


# ---------- check-ins and messages ----------
async def save_checkin(patient_id: str, mood: int, note: Optional[str]) -> Checkin:
    cid = new_id()
    checkins[cid] = {"id": cid, "patient_id": patient_id, "mood": mood, "note": note, "created_at": now_iso()}
    return Checkin(**checkins[cid])


async def list_checkins(patient_id: str, date_from: Optional[str] = None, date_to: Optional[str] = None) -> list[Checkin]:
    rows = [c for c in checkins.values() if c["patient_id"] == patient_id]
    rows = [c for c in rows if (not date_from or c["created_at"][:10] >= date_from) and (not date_to or c["created_at"][:10] <= date_to)]
    return [Checkin(**c) for c in _sorted(rows)]


async def save_message(patient_id: str, sender: str, content: str, risk: Optional[str]) -> Message:
    mid = new_id()
    messages[mid] = {"id": mid, "patient_id": patient_id, "sender": sender, "content": content, "risk": risk, "created_at": now_iso()}
    return Message(**messages[mid])


async def list_messages(patient_id: str, limit: int = 50) -> list[Message]:
    rows = _sorted([m for m in messages.values() if m["patient_id"] == patient_id])
    return [Message(**m) for m in rows[-limit:]]


# ---------- questionnaires ----------
async def save_questionnaire(patient_id: str, kind: str, answers: list[int], score: int, severity: str) -> QuestionnaireResult:
    qid = new_id()
    questionnaires[qid] = {"id": qid, "patient_id": patient_id, "kind": kind, "answers": answers, "score": score, "severity": severity, "created_at": now_iso()}
    return QuestionnaireResult(**questionnaires[qid])


async def list_questionnaires(patient_id: str) -> list[QuestionnaireResult]:
    return [QuestionnaireResult(**q) for q in _sorted([q for q in questionnaires.values() if q["patient_id"] == patient_id])]


# ---------- alerts ----------
async def create_alert(patient_id: str, result: RiskResult, message_id: Optional[str]) -> Alert:
    aid = new_id()
    alerts[aid] = {
        "id": aid, "patient_id": patient_id, "specialist_id": patient_profiles[patient_id]["specialist_id"], "level": result.level,
        "source": result.source, "reason": result.reason, "message_id": message_id, "status": "open", "created_at": now_iso(),
    }
    return _alert(alerts[aid])


async def list_alerts(specialist_id: str, status: Optional[str] = None) -> list[Alert]:
    rows = [a for a in alerts.values() if a["specialist_id"] == specialist_id and (not status or a["status"] == status)]
    return [_alert(a) for a in reversed(_sorted(rows))]


async def get_alert(alert_id: str) -> Optional[Alert]:
    return _alert(alerts[alert_id]) if alert_id in alerts else None


async def get_alert_specialist(alert_id: str) -> Optional[str]:
    return alerts.get(alert_id, {}).get("specialist_id")


async def update_alert(alert_id: str, status: str) -> Alert:
    if alert_id not in alerts:
        raise not_found("Alert")
    alerts[alert_id]["status"] = status
    return _alert(alerts[alert_id])


# ---------- specialist views ----------
async def list_patients(specialist_id: str) -> list[PatientRow]:
    rows = []
    for pid, pp in patient_profiles.items():
        if pp["specialist_id"] != specialist_id:
            continue
        mine_ci = [c for c in checkins.values() if c["patient_id"] == pid]
        open_a = [a for a in alerts.values() if a["patient_id"] == pid and a["status"] == "open"]
        upcoming = sorted(a["starts_at"] for a in appointments.values() if a["patient_id"] == pid and a["status"] == "scheduled" and a["starts_at"] >= now_iso())
        rows.append(build_patient_row(profiles[pid], mine_ci, open_a, upcoming[0] if upcoming else None))
    return sorted(rows, key=lambda r: (RISK_ORDER[r.current_risk], r.nickname))


async def get_week_data(patient_id: str, week_start: str) -> WeekData:
    from datetime import date, timedelta

    end = (date.fromisoformat(week_start) + timedelta(days=6)).isoformat()
    consent = patient_profiles[patient_id]["consent"]
    msgs = [m for m in await list_messages(patient_id, 500) if week_start <= m.created_at[:10] <= end] if consent == "full_chat" else []
    return WeekData(
        patient_id=patient_id, nickname=profiles[patient_id]["nickname"], week_start=week_start,
        checkins=await list_checkins(patient_id, week_start, end),
        homework=await list_homework(patient_id),
        questionnaires=[q for q in await list_questionnaires(patient_id) if week_start <= q.created_at[:10] <= end],
        messages=msgs,
    )


async def save_summary(patient_id: str, week_start: str, content: WeeklySummaryContent) -> WeeklySummary:
    existing = next((s for s in summaries.values() if s["patient_id"] == patient_id and s["week_start"] == week_start), None)
    sid = existing["id"] if existing else new_id()
    summaries[sid] = {"id": sid, "patient_id": patient_id, "week_start": week_start, "content": content.model_dump()}
    return WeeklySummary(**summaries[sid])


async def list_summaries(patient_id: str) -> list[WeeklySummary]:
    rows = sorted([s for s in summaries.values() if s["patient_id"] == patient_id], key=lambda s: s["week_start"], reverse=True)
    return [WeeklySummary(**s) for s in rows]
