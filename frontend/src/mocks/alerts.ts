import type { Alert } from '@/types/contract'
import { PATIENT_B_ID, PATIENT_C_ID, daysFromNow } from './ids'

export const alerts: Alert[] = [
  {
    id: 'alert-b-1',
    patient_id: PATIENT_B_ID,
    patient_nickname: 'Karim',
    level: 'orange',
    source: 'trend',
    reason: 'Mood fell from 4 to 1-2 over the last 5 days.',
    message_excerpt: null,
    status: 'open',
    created_at: daysFromNow(-1, 21),
  },
]

/** Fired by the mock realtime feed ~20 s after the dashboard opens, so B can build the live alert UI. */
export const liveRedAlert: Alert = {
  id: 'alert-c-live',
  patient_id: PATIENT_C_ID,
  patient_nickname: 'Yasmine',
  level: 'red',
  source: 'rules',
  reason: 'Crisis keyword detected in chat.',
  message_excerpt: 'ma3adch nheb n3ich…',
  status: 'open',
  created_at: new Date().toISOString(),
}
