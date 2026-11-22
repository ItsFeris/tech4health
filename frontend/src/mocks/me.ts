import type { Me } from '@/types/contract'
import { PATIENT_C_ID, SPECIALIST_ID } from './ids'

export const mePatient: Me = {
  id: PATIENT_C_ID,
  role: 'patient',
  nickname: 'Yasmine',
  language: 'darija',
  consent: 'summary_only',
  specialist_id: SPECIALIST_ID,
  emergency_name: 'Sami (brother)',
}

export const meSpecialist: Me = {
  id: SPECIALIST_ID,
  role: 'specialist',
  nickname: 'Dr. Salma Trabelsi',
  language: 'fr',
}
