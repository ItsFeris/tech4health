/**
 * Contract types — mirror of docs/CONTRACT.md section 5 (v1.1).
 * DHIA ONLY. A and B: never edit this file. Need a change? Ask Dhia.
 * Backend Pydantic models in backend/app/models/contract.py match these field for field.
 */

export type Lang = 'darija' | 'ar' | 'fr' | 'en'
export type Consent = 'summary_only' | 'full_chat'
export type Risk = 'green' | 'orange' | 'red'
export type RiskSource = 'rules' | 'llm' | 'trend' | 'sos' | 'questionnaire'
export type Role = 'patient' | 'specialist'

export interface Me {
  id: string
  role: Role
  nickname: string
  language: Lang
  consent?: Consent
  specialist_id?: string | null
  emergency_name?: string | null
}

export interface Appointment {
  id: string
  patient_id: string
  specialist_id: string
  starts_at: string
  type: 'weekly' | 'urgent'
  status: 'scheduled' | 'done' | 'cancelled'
}

export interface SessionNote {
  appointment_id: string
  notes?: string | null
  takeaways: string | null
}

export interface Homework {
  id: string
  patient_id: string
  title: string
  description: string | null
  due_date: string | null
  done: boolean
}

export interface Checkin {
  id: string
  mood: 1 | 2 | 3 | 4 | 5
  note: string | null
  created_at: string
}

export interface Message {
  id: string
  sender: 'user' | 'ai'
  content: string
  risk: Risk | null
  created_at: string
}

export interface RiskResult {
  level: Risk
  source: RiskSource
  reason: string
}

export interface Crisis {
  title: string
  body: string
  actions: { label: string; kind: 'call' | 'sos' | 'breathing' }[]
}

export interface ChatReply {
  user_message: Message
  ai_message: Message
  risk: RiskResult
  crisis: Crisis | null
  urgent_appointment: Appointment | null
}

export interface CheckinReply {
  checkin: Checkin
  ai_reply: string
  risk: RiskResult
  crisis: Crisis | null
}

export type Severity = 'minimal' | 'mild' | 'moderate' | 'moderately_severe' | 'severe'

export interface QuestionnaireResult {
  id: string
  kind: 'phq9' | 'gad7'
  score: number
  severity: Severity
  created_at: string
}

export interface QuestionnaireReply {
  result: QuestionnaireResult
  risk: RiskResult
  crisis: Crisis | null
}

export interface SosReply {
  alert: Alert
  crisis: Crisis
}

export interface Alert {
  id: string
  patient_id: string
  patient_nickname: string
  level: 'orange' | 'red'
  source: RiskSource
  reason: string
  message_excerpt: string | null
  status: 'open' | 'seen' | 'false_alarm' | 'resolved'
  created_at: string
}

export interface PatientRow {
  patient_id: string
  nickname: string
  current_risk: Risk
  open_alerts: number
  last_mood: number | null
  mood_7d: (number | null)[]
  next_appointment: string | null
}

export interface WeeklySummaryContent {
  mood_trend: 'improving' | 'stable' | 'declining'
  mood_avg: number | null
  key_events: string[]
  homework: { title: string; done: boolean }[]
  concerns: string[]
  prep_topic: string | null
}

export interface WeeklySummary {
  id: string
  patient_id: string
  week_start: string
  content: WeeklySummaryContent
}

export interface ApiError {
  error: { code: string; message: string }
}

/* ---------- Request bodies (section 5, "Body" column) ---------- */

export interface PatientOnboardingBody {
  nickname: string
  language: Lang
  consent: Consent
  emergency_name?: string | null
  emergency_email?: string | null
}

export interface SpecialistOnboardingBody {
  nickname: string
  language: Lang
  specialty?: string | null
  bio?: string | null
}

export interface NewAppointmentBody {
  patient_id: string
  starts_at: string
  type: 'weekly' | 'urgent'
}

export interface UpdateAppointmentBody {
  starts_at?: string
  status?: Appointment['status']
}

export interface SessionNoteBody {
  notes?: string | null
  takeaways?: string | null
}

export interface NewHomeworkBody {
  patient_id: string
  title: string
  description?: string | null
  due_date?: string | null
}

export interface UpdateHomeworkBody {
  done?: boolean
  title?: string
  description?: string | null
}
