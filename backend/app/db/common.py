"""Helpers shared by both database implementations."""

import uuid
from datetime import date, datetime, timedelta, timezone

from app.models import PatientRow

RISK_ORDER = {"red": 0, "orange": 1, "green": 2}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def new_id() -> str:
    return str(uuid.uuid4())


def days_from_now(days: int, hour: int = 10) -> str:
    d = datetime.now(timezone.utc).replace(hour=hour, minute=0, second=0, microsecond=0) + timedelta(days=days)
    return d.isoformat(timespec="seconds").replace("+00:00", "Z")


def mood_7d(checkins: list[dict]) -> list[int | None]:
    """One value per day for the last 7 days (oldest first), the last check-in of each day, None if missing."""
    today = datetime.now(timezone.utc).date()
    by_day: dict[date, int] = {}
    for c in sorted(checkins, key=lambda c: c["created_at"]):
        by_day[date.fromisoformat(c["created_at"][:10])] = c["mood"]
    return [by_day.get(today - timedelta(days=6 - i)) for i in range(7)]


def build_patient_row(profile: dict, checkins: list[dict], open_alerts: list[dict], next_appt: str | None) -> PatientRow:
    levels = [a["level"] for a in open_alerts]
    risk = "red" if "red" in levels else "orange" if "orange" in levels else "green"
    last = sorted(checkins, key=lambda c: c["created_at"])[-1]["mood"] if checkins else None
    return PatientRow(
        patient_id=profile["id"],
        nickname=profile["nickname"],
        current_risk=risk,
        open_alerts=len(open_alerts),
        last_mood=last,
        mood_7d=mood_7d(checkins),
        next_appointment=next_appt,
    )
