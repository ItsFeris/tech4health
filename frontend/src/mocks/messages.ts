import type { Message } from '@/types/contract'
import { daysFromNow } from './ids'

/** Chat history of the logged-in demo patient (oldest first). */
export const messages: Message[] = [
  { id: 'm1', sender: 'ai', content: 'Ahla Yasmine 👋 Kifech kan nharek lyoum?', risk: null, created_at: daysFromNow(-1, 19) },
  { id: 'm2', sender: 'user', content: 'Mouch khayeb, ama 3andi stress m3a el exams.', risk: 'green', created_at: daysFromNow(-1, 19) },
  { id: 'm3', sender: 'ai', content: 'Normal barcha 3la el exams. T7eb na3mlou exercice respiration sghir m3a b3adhna?', risk: null, created_at: daysFromNow(-1, 19) },
]
