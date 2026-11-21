import type { WeeklySummary } from '@/types/contract'
import { USE_MOCKS, mock, newId, qs, request } from './client'
import { summaries as store } from '@/mocks/summaries'

/** GET /summaries (specialist) */
export function getSummaries(patientId: string): Promise<WeeklySummary[]> {
  if (USE_MOCKS) return mock(store.filter((s) => s.patient_id === patientId))
  return request<WeeklySummary[]>('GET', `/summaries${qs({ patient_id: patientId })}`)
}

/** POST /summaries/generate (specialist) — weekStart is a Monday, YYYY-MM-DD. Takes a few seconds. */
export function generateSummary(patientId: string, weekStart: string): Promise<WeeklySummary> {
  if (USE_MOCKS) {
    const existing = store.find((s) => s.patient_id === patientId && s.week_start === weekStart)
    const summary: WeeklySummary = existing ?? {
      id: newId('sum'),
      patient_id: patientId,
      week_start: weekStart,
      content: { mood_trend: 'stable', mood_avg: 3.4, key_events: ['Regular daily check-ins'], homework: [], concerns: [], prep_topic: null },
    }
    if (!existing) store.push(summary)
    return mock(summary, 1500)
  }
  return request<WeeklySummary>('POST', '/summaries/generate', { patient_id: patientId, week_start: weekStart })
}
