import type { Checkin, CheckinReply } from '@/types/contract'
import { USE_MOCKS, mock, newId, qs, request } from './client'
import { getMockRole } from './mockSession'
import { checkins as store } from '@/mocks/checkins'
import { crisis } from '@/mocks/crisis'
import { mePatient } from '@/mocks/me'
import { mockAssess } from './mockRisk'

/** POST /checkins (patient) — mood 1..5 and an optional note. */
export function sendCheckin(mood: Checkin['mood'], note?: string | null): Promise<CheckinReply> {
  if (USE_MOCKS) {
    const checkin = { id: newId('ci'), patient_id: mePatient.id, mood, note: note ?? null, created_at: new Date().toISOString() }
    store.push(checkin)
    const risk = mood === 1 ? { level: 'orange' as const, source: 'trend' as const, reason: 'Very low mood today (mock).' } : mockAssess(note ?? '')
    const ai_reply = mood >= 4 ? 'Yesser behi! Chnowa li 3amal nharek mezyen?' : 'Merci 3la sra7tek. T7eb tehki chwaya 3la chnowa sar?'
    return mock({ checkin, ai_reply, risk, crisis: risk.level === 'red' ? crisis : null })
  }
  return request<CheckinReply>('POST', '/checkins', { mood, note: note ?? null })
}

/** GET /checkins — patient: own (no patientId). Specialist: pass patientId. Dates are YYYY-MM-DD. */
export function getCheckins(patientId?: string, from?: string, to?: string): Promise<Checkin[]> {
  if (USE_MOCKS) {
    const pid = getMockRole() === 'patient' ? mePatient.id : patientId
    const list = store
      .filter((c) => c.patient_id === pid)
      .filter((c) => (!from || c.created_at.slice(0, 10) >= from) && (!to || c.created_at.slice(0, 10) <= to))
      .map(({ id, mood, note, created_at }) => ({ id, mood, note, created_at }))
    return mock(list)
  }
  return request<Checkin[]>('GET', `/checkins${qs({ patient_id: patientId, from, to })}`)
}
