import type { Lang } from '@/types/contract'
import { USE_MOCKS, mock, mockError, request } from './client'

/** POST /voice/stt — POSTPONED (not in the core demo). */
export function speechToText(audio: Blob): Promise<{ text: string; language: Lang }> {
  if (USE_MOCKS) return mock({ text: 'Ahla, ena mouch mrigel lyoum.', language: 'darija' as const }, 800)
  const form = new FormData()
  form.append('audio', audio, 'audio.webm')
  return request('POST', '/voice/stt', form)
}

/** POST /voice/tts — POSTPONED. Returns an mp3 Blob: play with new Audio(URL.createObjectURL(blob)). */
export function textToSpeech(text: string, language: Lang): Promise<Blob> {
  if (USE_MOCKS) return mockError('not_implemented', 'Voice is postponed', 501)
  return request<Blob>('POST', '/voice/tts', { text, language })
}
