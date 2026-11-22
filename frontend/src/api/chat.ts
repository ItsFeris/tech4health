import type { ChatAction, ChatReply, Message } from '@/types/contract'
import { USE_MOCKS, mock, newId, qs, request } from './client'
import { messages as store } from '@/mocks/messages'
import { crisis } from '@/mocks/crisis'
import { appointments } from '@/mocks/appointments'
import { mePatient } from '@/mocks/me'
import { mockAssess } from './mockRisk'
import { homework } from '@/mocks/homework'
import { checkins } from '@/mocks/checkins'

const MOCK_TOOL_TEXT: Record<ChatAction['type'], string> = {
  breathing: "Let's breathe together. Follow the circle, I'm here.",
  grounding: "Let's come back to the here and now, one sense at a time.",
  thought_record: "Let's look at that thought together. Write it down, no pressure.",
  mood_logged: 'Saved your mood. Thank you for telling me.',
  homework_list: "Here's what your specialist gave you this week.",
  homework_done: 'Bravo, marked as done!',
  next_session: "Here's your next session.",
  mood_history: "Here's how your week looked.",
}

/** Mock of Nour's tools: obvious requests open the same cards the real backend sends. */
function mockActions(text: string): ChatAction[] {
  const t = text.toLowerCase()
  if (/breath|respir|netneffs|تنفس/.test(t)) return [{ type: 'breathing', pattern: 'slow', cycles: 4 }]
  if (/ground|5-4-3-2-1|ancrage|overwhelm/.test(t)) return [{ type: 'grounding' }]
  if (/thought record|useless|nul|pens[ée]e/.test(t)) return [{ type: 'thought_record', situation: null }]
  if (/homework|devoir|wejbet/.test(t)) return [{ type: 'homework_list', homework: homework.filter((h) => h.patient_id === mePatient.id) }]
  if (/next session|s[ée]ance|maw3ed|rendez-vous/.test(t)) {
    const now = new Date().toISOString()
    const next = appointments.filter((a) => a.patient_id === mePatient.id && a.status === 'scheduled' && a.starts_at >= now).sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0]
    return [{ type: 'next_session', appointment: next ?? null }]
  }
  if (/my week|my mood|how have i been|semaine/.test(t)) return [{ type: 'mood_history', moods: checkins.filter((c) => c.patient_id === mePatient.id) }]
  return []
}

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
    const actions = risk.level === 'red' ? [] : mockActions(content)
    const ai_message: Message = { id: newId('m'), sender: 'ai', content: actions.length ? MOCK_TOOL_TEXT[actions[0].type] : aiText, risk: null, created_at: now }
    store.push(user_message, ai_message)
    const urgent_appointment =
      risk.level === 'orange'
        ? { id: newId('appt'), patient_id: mePatient.id, specialist_id: mePatient.specialist_id ?? '', starts_at: new Date(Date.now() + 864e5).toISOString(), type: 'urgent' as const, status: 'scheduled' as const }
        : null
    if (urgent_appointment) appointments.push(urgent_appointment)
    return mock({ user_message, ai_message, risk, crisis: risk.level === 'red' ? crisis : null, urgent_appointment, actions }, 900)
  }
  return request<ChatReply>('POST', '/chat', { content })
}

/** GET /chat/history — patient: own (no patientId). Specialist: pass patientId (only works with full_chat consent). */
export function getChatHistory(patientId?: string, limit = 50): Promise<Message[]> {
  if (USE_MOCKS) return mock(store.slice(-limit))
  return request<Message[]>('GET', `/chat/history${qs({ patient_id: patientId, limit })}`)
}
