import type { Checkin } from '@/types/contract'
import { PATIENT_A_ID, PATIENT_B_ID, PATIENT_C_ID, daysFromNow } from './ids'

type Mood = Checkin['mood']
const week = (patient: string, moods: Mood[], notes: (string | null)[] = []) =>
  moods.map<Checkin & { patient_id: string }>((mood, i) => ({
    id: `ci-${patient.slice(-2)}-${i}`,
    patient_id: patient,
    mood,
    note: notes[i] ?? null,
    created_at: daysFromNow(i - moods.length + 1, 20),
  }))

/** Check-ins of the last 7 days per patient (oldest first). patient_id is mock-only bookkeeping. */
export const checkins = [
  ...week(PATIENT_A_ID, [3, 4, 4, 3, 4, 4, 5], [null, 'Good day at work', null, null, null, null, 'Saw friends']),
  ...week(PATIENT_B_ID, [4, 3, 3, 2, 2, 1, 2], [null, null, 'Could not sleep', null, 'Exam stress', 'Feeling empty', null]),
  ...week(PATIENT_C_ID, [3, 3, 2, 3, 4, 3, 3], [null, null, 'Argument at home', null, 'Breathing helped', null, null]),
]
