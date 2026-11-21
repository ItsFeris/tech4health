import type { PatientRow } from '@/types/contract'
import { PATIENT_A_ID, PATIENT_B_ID, PATIENT_C_ID, daysFromNow } from './ids'

export const patients: PatientRow[] = [
  { patient_id: PATIENT_B_ID, nickname: 'Karim', current_risk: 'orange', open_alerts: 1, last_mood: 2, mood_7d: [4, 3, 3, 2, 2, 1, 2], next_appointment: daysFromNow(1, 11) },
  { patient_id: PATIENT_C_ID, nickname: 'Yasmine', current_risk: 'green', open_alerts: 0, last_mood: 3, mood_7d: [3, 3, 2, 3, 4, 3, 3], next_appointment: daysFromNow(3, 15) },
  { patient_id: PATIENT_A_ID, nickname: 'Mehdi', current_risk: 'green', open_alerts: 0, last_mood: 5, mood_7d: [3, 4, 4, 3, 4, null, 5], next_appointment: daysFromNow(2, 9) },
]
