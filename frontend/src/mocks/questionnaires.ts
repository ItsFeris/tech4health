import type { QuestionnaireResult } from '@/types/contract'
import { daysFromNow } from './ids'

export const questionnaireResults: QuestionnaireResult[] = [
  { id: 'q-1', kind: 'phq9', score: 11, severity: 'moderate', created_at: daysFromNow(-14) },
  { id: 'q-2', kind: 'phq9', score: 8, severity: 'mild', created_at: daysFromNow(-1) },
  { id: 'q-3', kind: 'gad7', score: 9, severity: 'mild', created_at: daysFromNow(-1) },
]
