import type { WeeklySummary } from '@/types/contract'
import { PATIENT_B_ID, PATIENT_C_ID, thisMonday } from './ids'

export const summaries: WeeklySummary[] = [
  {
    id: 'sum-b-1',
    patient_id: PATIENT_B_ID,
    week_start: thisMonday(),
    content: {
      mood_trend: 'declining',
      mood_avg: 2.4,
      key_events: ['Exam period started', 'Two nights with very little sleep'],
      homework: [{ title: 'Sleep diary', done: false }],
      concerns: ['Feels "empty" since Thursday', 'Skipped the sleep diary'],
      prep_topic: 'Talk about exam pressure from family',
    },
  },
  {
    id: 'sum-c-1',
    patient_id: PATIENT_C_ID,
    week_start: thisMonday(),
    content: {
      mood_trend: 'stable',
      mood_avg: 3.0,
      key_events: ['Argument at home on Wednesday', 'Breathing exercise helped on Friday'],
      homework: [
        { title: '5-minute breathing, every evening', done: false },
        { title: 'Write down 3 good things each day', done: true },
      ],
      concerns: [],
      prep_topic: 'How to handle conflicts at home',
    },
  },
]
