import type { Appointment } from '@/types/contract'
import { PATIENT_A_ID, PATIENT_B_ID, PATIENT_C_ID, SPECIALIST_ID, daysFromNow } from './ids'

export const appointments: Appointment[] = [
  { id: 'appt-c-next', patient_id: PATIENT_C_ID, specialist_id: SPECIALIST_ID, starts_at: daysFromNow(3, 15), type: 'weekly', status: 'scheduled' },
  { id: 'appt-c-past', patient_id: PATIENT_C_ID, specialist_id: SPECIALIST_ID, starts_at: daysFromNow(-4, 15), type: 'weekly', status: 'done' },
  { id: 'appt-a-next', patient_id: PATIENT_A_ID, specialist_id: SPECIALIST_ID, starts_at: daysFromNow(2, 9), type: 'weekly', status: 'scheduled' },
  { id: 'appt-b-next', patient_id: PATIENT_B_ID, specialist_id: SPECIALIST_ID, starts_at: daysFromNow(1, 11), type: 'urgent', status: 'scheduled' },
]
