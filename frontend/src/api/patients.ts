import type { PatientRow } from '@/types/contract'
import { USE_MOCKS, mock, request } from './client'
import { patients as store } from '@/mocks/patients'

const order = { red: 0, orange: 1, green: 2 } as const

/** GET /patients (specialist) — sorted red, then orange, then green. */
export function getPatients(): Promise<PatientRow[]> {
  if (USE_MOCKS) return mock([...store].sort((a, b) => order[a.current_risk] - order[b.current_risk]))
  return request<PatientRow[]>('GET', '/patients')
}
