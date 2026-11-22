"""Pydantic mirror of frontend/src/types/contract.ts (CONTRACT section 5). Shared file: Dhia only."""

from typing import Literal, Optional

from pydantic import BaseModel, Field

Lang = Literal["darija", "ar", "fr", "en"]
Consent = Literal["summary_only", "full_chat"]
Risk = Literal["green", "orange", "red"]
RiskSource = Literal["rules", "llm", "trend", "sos", "questionnaire"]
Role = Literal["patient", "specialist"]
ApptType = Literal["weekly", "urgent"]
ApptStatus = Literal["scheduled", "done", "cancelled"]
AlertStatus = Literal["open", "seen", "false_alarm", "resolved"]
Severity = Literal["minimal", "mild", "moderate", "moderately_severe", "severe"]
QKind = Literal["phq9", "gad7"]


class Me(BaseModel):
    id: str
    role: Role
    nickname: str
    language: Lang
    consent: Optional[Consent] = None
    specialist_id: Optional[str] = None
    emergency_name: Optional[str] = None


class Appointment(BaseModel):
    id: str
    patient_id: str
    specialist_id: str
    starts_at: str
    type: ApptType
    status: ApptStatus


class SessionNote(BaseModel):
    appointment_id: str
    notes: Optional[str] = None
    takeaways: Optional[str] = None


class Homework(BaseModel):
    id: str
    patient_id: str
    title: str
    description: Optional[str] = None
    due_date: Optional[str] = None
    done: bool = False


class Checkin(BaseModel):
    id: str
    mood: int = Field(ge=1, le=5)
    note: Optional[str] = None
    created_at: str


class Message(BaseModel):
    id: str
    sender: Literal["user", "ai"]
    content: str
    risk: Optional[Risk] = None
    created_at: str


class RiskResult(BaseModel):
    level: Risk
    source: RiskSource
    reason: str


class CrisisAction(BaseModel):
    label: str
    kind: Literal["call", "sos", "breathing"]


class Crisis(BaseModel):
    title: str
    body: str
    actions: list[CrisisAction]


class ChatAction(BaseModel):
    """Something Nour did with a tool, shown as a card under its reply (CONTRACT v1.3)."""

    type: Literal["breathing", "grounding", "thought_record", "mood_logged", "homework_list", "homework_done", "next_session", "mood_history"]
    pattern: Optional[Literal["box", "478", "slow"]] = None  # breathing
    cycles: Optional[int] = None  # breathing
    situation: Optional[str] = None  # thought_record: what the patient described
    checkin: Optional[Checkin] = None  # mood_logged
    homework: list[Homework] = []  # homework_list / homework_done
    appointment: Optional[Appointment] = None  # next_session (null = none booked)
    moods: list[Checkin] = []  # mood_history


class ChatReply(BaseModel):
    user_message: Message
    ai_message: Message
    risk: RiskResult
    crisis: Optional[Crisis] = None
    urgent_appointment: Optional[Appointment] = None
    actions: list[ChatAction] = []


class CheckinReply(BaseModel):
    checkin: Checkin
    ai_reply: str
    risk: RiskResult
    crisis: Optional[Crisis] = None


class QuestionnaireResult(BaseModel):
    id: str
    kind: QKind
    score: int
    severity: Severity
    created_at: str


class QuestionnaireReply(BaseModel):
    result: QuestionnaireResult
    risk: RiskResult
    crisis: Optional[Crisis] = None


class Alert(BaseModel):
    id: str
    patient_id: str
    patient_nickname: str
    level: Literal["orange", "red"]
    source: RiskSource
    reason: str
    message_excerpt: Optional[str] = None
    status: AlertStatus
    created_at: str


class SosReply(BaseModel):
    alert: Alert
    crisis: Crisis


class PatientRow(BaseModel):
    patient_id: str
    nickname: str
    current_risk: Risk
    open_alerts: int
    last_mood: Optional[int] = None
    mood_7d: list[Optional[int]]
    next_appointment: Optional[str] = None


class SummaryHomework(BaseModel):
    title: str
    done: bool


class WeeklySummaryContent(BaseModel):
    mood_trend: Literal["improving", "stable", "declining"]
    mood_avg: Optional[float] = None
    key_events: list[str]
    homework: list[SummaryHomework]
    concerns: list[str]
    prep_topic: Optional[str] = None


class WeeklySummary(BaseModel):
    id: str
    patient_id: str
    week_start: str
    content: WeeklySummaryContent


# ---------- request bodies ----------


class PatientOnboardingBody(BaseModel):
    nickname: str = Field(min_length=1, max_length=40)
    language: Lang
    consent: Consent
    emergency_name: Optional[str] = None
    emergency_email: Optional[str] = None
    specialist_id: Optional[str] = None  # v1.4: chosen in onboarding; null = first verified specialist


class SpecialistOnboardingBody(BaseModel):
    nickname: str = Field(min_length=1, max_length=60)
    language: Lang
    specialty: Optional[str] = None
    bio: Optional[str] = None
    languages: list[Lang] = []  # v1.4
    years: Optional[int] = Field(default=None, ge=0, le=60)  # v1.4: years of practice
    price: Optional[int] = Field(default=None, ge=0, le=1000)  # v1.4: DT per 50-min session
    photo_url: Optional[str] = Field(default=None, max_length=300_000)  # v1.4: small data: URL or https URL


class SpecialistCard(BaseModel):
    """v1.4: what patients see when they choose a specialist. Public info only."""
    id: str
    nickname: str
    specialty: Optional[str] = None
    bio: Optional[str] = None
    languages: list[Lang] = []
    years: Optional[int] = None
    price: Optional[int] = None
    photo_url: Optional[str] = None
    verified: bool = False
    accepting: bool = True


class VerifyBody(BaseModel):
    """v1.4: result of the in-app checks (ID card, license, selfie). All three must pass."""
    id_card: bool
    license: bool
    selfie: bool


class Takeaways(BaseModel):
    """v1.4: the specialist's note for the patient after the last session."""
    appointment_id: str
    session_date: str
    takeaways: str


class ConsentBody(BaseModel):
    consent: Consent


class NewAppointmentBody(BaseModel):
    patient_id: str
    starts_at: str
    type: ApptType = "weekly"


class UpdateAppointmentBody(BaseModel):
    starts_at: Optional[str] = None
    status: Optional[ApptStatus] = None


class SessionNoteBody(BaseModel):
    notes: Optional[str] = None
    takeaways: Optional[str] = None


class NewHomeworkBody(BaseModel):
    patient_id: str
    title: str = Field(min_length=1)
    description: Optional[str] = None
    due_date: Optional[str] = None


class UpdateHomeworkBody(BaseModel):
    done: Optional[bool] = None
    title: Optional[str] = None
    description: Optional[str] = None


class CheckinBody(BaseModel):
    mood: int = Field(ge=1, le=5)
    note: Optional[str] = None


class ChatBody(BaseModel):
    content: str = Field(min_length=1, max_length=2000)


class QuestionnaireBody(BaseModel):
    kind: QKind
    answers: list[int]


class AlertStatusBody(BaseModel):
    status: AlertStatus


class GenerateSummaryBody(BaseModel):
    patient_id: str
    week_start: str


class TtsBody(BaseModel):
    text: str
    language: Lang
