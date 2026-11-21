import type { ChatReply, Message } from '@/types/contract'
import { USE_MOCKS, mock, newId, qs, request } from './client'
import { messages as store } from '@/mocks/messages'
import { crisis } from '@/mocks/crisis'
import { appointments } from '@/mocks/appointments'
import { mePatient } from '@/mocks/me'
import { mockAssess } from './mockRisk'

/** POST /chat (patient). If reply.crisis is not null, show the crisis screen. */
export function sendChat(content: string): Promise<ChatReply> {
  if (USE_MOCKS) {
    const risk = mockAssess(content)
    const now = new Date().toISOString()
    const user_message: Message = { id: newId('m'), sender: 'user', content, risk: risk.level, created_at: now }
    const aiText =
      risk.level === 'red'
        ? "Ena hna m3ak. Your specialist has been told right now. You don't have to go through this alone."
        : risk.level === 'orange'
          ? "Fhemtek, yeser s3ib. I've asked your specialist to see you sooner. T7eb tehkili akthar?"
          : 'Merci li 7kitli. Kifech t7es tawa, wel exercice ta3 respiration 3maltou lyoum?'
    const ai_message: Message = { id: newId('m'), sender: 'ai', content: aiText, risk: null, created_at: now }
    store.push(user_message, ai_message)
    const urgent_appointment =
      risk.level === 'orange'
        ? { id: newId('appt'), patient_id: mePatient.id, specialist_id: mePatient.specialist_id ?? '', starts_at: new Date(Date.now() + 864e5).toISOString(), type: 'urgent' as const, status: 'scheduled' as const }
        : null
    if (urgent_appointment) appointments.push(urgent_appointment)
    return mock({ user_message, ai_message, risk, crisis: risk.level === 'red' ? crisis : null, urgent_appointment }, 900)
  }
  return request<ChatReply>('POST', '/chat', { content })
}

/** GET /chat/history — patient: own (no patientId). Specialist: pass patientId (only works with full_chat consent). */
export function getChatHistory(patientId?: string, limit = 50): Promise<Message[]> {
  if (USE_MOCKS) return mock(store.slice(-limit))
  return request<Message[]>('GET', `/chat/history${qs({ patient_id: patientId, limit })}`)
}
