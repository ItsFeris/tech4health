"""Types passed between backend modules (CONTRACT section 6). Not sent to the frontend."""

from typing import Optional

from pydantic import BaseModel

from .contract import Alert, Appointment, Checkin, Consent, Crisis, Homework, Lang, Message, QuestionnaireResult


class PatientContext(BaseModel):
    patient_id: str
    nickname: str
    language: Lang
    consent: Consent
    specialist_id: Optional[str]
    emergency_name: Optional[str] = None
    emergency_email: Optional[str] = None
    open_homework: list[Homework] = []
    recent_messages: list[Message] = []  # last 20, oldest first
    recent_checkins: list[Checkin] = []  # last 7, oldest first


class WeekData(BaseModel):
    patient_id: str
    nickname: str
    week_start: str
    checkins: list[Checkin]
    homework: list[Homework]
    questionnaires: list[QuestionnaireResult]
    messages: list[Message]  # empty unless consent = full_chat


class EscalationOutcome(BaseModel):
    alert: Optional[Alert] = None
    urgent_appointment: Optional[Appointment] = None
    crisis: Optional[Crisis] = None
