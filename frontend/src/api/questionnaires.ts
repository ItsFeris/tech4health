import type { QuestionnaireReply, QuestionnaireResult, Severity } from '@/types/contract'
import { USE_MOCKS, mock, newId, qs, request } from './client'
import { questionnaireResults as store } from '@/mocks/questionnaires'
import { crisis } from '@/mocks/crisis'

function severity(kind: 'phq9' | 'gad7', score: number): Severity {
  if (score <= 4) return 'minimal'
  if (score <= 9) return 'mild'
  if (score <= 14) return 'moderate'
  if (kind === 'gad7') return 'severe'
  return score <= 19 ? 'moderately_severe' : 'severe'
}

/** POST /questionnaires (patient). answers: PHQ-9 = 9 numbers, GAD-7 = 7 numbers, each 0..3. */
export function submitQuestionnaire(kind: 'phq9' | 'gad7', answers: number[]): Promise<QuestionnaireReply> {
  if (USE_MOCKS) {
    const score = answers.reduce((a, b) => a + b, 0)
    const result: QuestionnaireResult = { id: newId('q'), kind, score, severity: severity(kind, score), created_at: new Date().toISOString() }
    store.push(result)
    const item9 = kind === 'phq9' ? (answers[8] ?? 0) : 0
    const level = item9 >= 2 ? 'red' : item9 === 1 ? 'orange' : 'green'
    const risk = { level, source: 'questionnaire', reason: level === 'green' ? 'No warning signs (mock).' : 'PHQ-9 question 9 answered (mock).' } as const
    return mock({ result, risk, crisis: level === 'red' ? crisis : null })
  }
  return request<QuestionnaireReply>('POST', '/questionnaires', { kind, answers })
}

/** GET /questionnaires — patient: own (no patientId). Specialist: pass patientId. */
export function getQuestionnaireResults(patientId?: string): Promise<QuestionnaireResult[]> {
  if (USE_MOCKS) return mock(store)
  return request<QuestionnaireResult[]>('GET', `/questionnaires${qs({ patient_id: patientId })}`)
}
