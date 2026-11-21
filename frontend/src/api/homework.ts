import type { Homework, NewHomeworkBody, UpdateHomeworkBody } from '@/types/contract'
import { USE_MOCKS, mock, mockError, newId, qs, request } from './client'
import { getMockRole } from './mockSession'
import { homework as store } from '@/mocks/homework'
import { mePatient } from '@/mocks/me'

/** GET /homework — patient: own homework (no argument). Specialist: pass the patient id. */
export function getHomework(patientId?: string): Promise<Homework[]> {
  if (USE_MOCKS) {
    const pid = getMockRole() === 'patient' ? mePatient.id : patientId
    return mock(store.filter((h) => h.patient_id === pid))
  }
  return request<Homework[]>('GET', `/homework${qs({ patient_id: patientId })}`)
}

/** POST /homework (specialist) */
export function createHomework(body: NewHomeworkBody): Promise<Homework> {
  if (USE_MOCKS) {
    const hw: Homework = { id: newId('hw'), done: false, description: null, due_date: null, ...body }
    store.push(hw)
    return mock(hw)
  }
  return request<Homework>('POST', '/homework', body)
}

/** PATCH /homework/{id} — e.g. updateHomework(id, { done: true }) */
export function updateHomework(id: string, body: UpdateHomeworkBody): Promise<Homework> {
  if (USE_MOCKS) {
    const hw = store.find((h) => h.id === id)
    if (!hw) return mockError('not_found', 'Homework not found', 404)
    Object.assign(hw, body)
    return mock(hw)
  }
  return request<Homework>('PATCH', `/homework/${id}`, body)
}
