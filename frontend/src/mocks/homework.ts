import type { Homework } from '@/types/contract'
import { PATIENT_A_ID, PATIENT_B_ID, PATIENT_C_ID, dateFromNow } from './ids'

export const homework: Homework[] = [
  { id: 'hw-c-1', patient_id: PATIENT_C_ID, title: '5-minute breathing, every evening', description: 'Box breathing: in 4s, hold 4s, out 4s, hold 4s.', due_date: dateFromNow(3), done: false },
  { id: 'hw-c-2', patient_id: PATIENT_C_ID, title: 'Write down 3 good things each day', description: null, due_date: dateFromNow(3), done: true },
  { id: 'hw-a-1', patient_id: PATIENT_A_ID, title: 'Walk 20 minutes outside', description: null, due_date: dateFromNow(2), done: true },
  { id: 'hw-b-1', patient_id: PATIENT_B_ID, title: 'Sleep diary', description: 'Note bedtime, wake time and how rested you feel.', due_date: dateFromNow(1), done: false },
]
