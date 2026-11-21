import type { Appointment, NewAppointmentBody, SessionNote, SessionNoteBody, UpdateAppointmentBody } from '@/types/contract'
import { USE_MOCKS, mock, mockError, newId, request } from './client'
import { getMockRole } from './mockSession'
import { appointments as store } from '@/mocks/appointments'
import { mePatient, meSpecialist } from '@/mocks/me'

const notes: Record<string, SessionNote> = {}

/** GET /appointments — own appointments, upcoming first. */
export function getAppointments(): Promise<Appointment[]> {
  if (USE_MOCKS) {
    const mine = getMockRole() === 'patient' ? store.filter((a) => a.patient_id === mePatient.id) : store.filter((a) => a.specialist_id === meSpecialist.id)
    return mock([...mine].sort((a, b) => a.starts_at.localeCompare(b.starts_at)))
  }
  return request<Appointment[]>('GET', '/appointments')
}

/** POST /appointments (specialist) */
export function createAppointment(body: NewAppointmentBody): Promise<Appointment> {
  if (USE_MOCKS) {
    const appt: Appointment = { id: newId('appt'), specialist_id: meSpecialist.id, status: 'scheduled', ...body }
    store.push(appt)
    return mock(appt)
  }
  return request<Appointment>('POST', '/appointments', body)
}

/** PATCH /appointments/{id} */
export function updateAppointment(id: string, body: UpdateAppointmentBody): Promise<Appointment> {
  if (USE_MOCKS) {
    const appt = store.find((a) => a.id === id)
    if (!appt) return mockError('not_found', 'Appointment not found', 404)
    Object.assign(appt, body)
    return mock(appt)
  }
  return request<Appointment>('PATCH', `/appointments/${id}`, body)
}

/** PUT /appointments/{id}/notes (specialist) */
export function saveSessionNote(appointmentId: string, body: SessionNoteBody): Promise<SessionNote> {
  if (USE_MOCKS) {
    notes[appointmentId] = { appointment_id: appointmentId, notes: body.notes ?? null, takeaways: body.takeaways ?? null }
    return mock(notes[appointmentId])
  }
  return request<SessionNote>('PUT', `/appointments/${appointmentId}/notes`, body)
}
