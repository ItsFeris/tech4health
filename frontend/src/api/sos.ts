import type { SosReply } from '@/types/contract'
import { USE_MOCKS, mock, newId, request } from './client'
import { crisis } from '@/mocks/crisis'
import { alerts } from '@/mocks/alerts'
import { mePatient } from '@/mocks/me'

/** POST /sos (patient) — always creates a red alert and returns the crisis payload. */
export function sendSos(): Promise<SosReply> {
  if (USE_MOCKS) {
    const alert = {
      id: newId('alert'),
      patient_id: mePatient.id,
      patient_nickname: mePatient.nickname,
      level: 'red' as const,
      source: 'sos' as const,
      reason: 'Patient pressed the SOS button.',
      message_excerpt: null,
      status: 'open' as const,
      created_at: new Date().toISOString(),
    }
    alerts.unshift(alert)
    return mock({ alert, crisis })
  }
  return request<SosReply>('POST', '/sos')
}
