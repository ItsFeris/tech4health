/** Tiny fake risk check used ONLY in mock mode, so A can build the crisis screen. DHIA ONLY. */
import type { RiskResult } from '@/types/contract'

const RED = /(suicide|kill myself|end my life|nmout|n9atel rou7i|ma3adch nheb n3ich|انتحار|نموت|me tuer)/i
const ORANGE = /(hopeless|empty|ma3adch nnajjem|فارغ|j'en peux plus|tired of everything)/i

export function mockAssess(text: string): RiskResult {
  if (RED.test(text)) return { level: 'red', source: 'rules', reason: 'Crisis keyword detected (mock).' }
  if (ORANGE.test(text)) return { level: 'orange', source: 'rules', reason: 'Distress words detected (mock).' }
  return { level: 'green', source: 'rules', reason: 'No warning signs (mock).' }
}
