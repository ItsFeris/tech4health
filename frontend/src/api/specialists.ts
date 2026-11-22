import type { SpecialistCard, Takeaways, VerifyBody } from '@/types/contract'
import { USE_MOCKS, mock, mockError, request } from './client'
import { specialists, takeaways } from '@/mocks/specialists'
import { meSpecialist } from '@/mocks/me'

/** GET /specialists — verified specialists accepting patients (v1.4). Works before onboarding. */
export function listSpecialists(): Promise<SpecialistCard[]> {
  if (USE_MOCKS) return mock(specialists.filter((s) => s.verified && s.accepting))
  return request<SpecialistCard[]>('GET', '/specialists')
}

/** GET /specialists/{id} — a patient's own specialist, or a specialist's own card. */
export function getSpecialist(id: string): Promise<SpecialistCard> {
  if (USE_MOCKS) {
    const s = specialists.find((x) => x.id === id)
    return s ? mock(s) : mockError('not_found', 'Specialist not found', 404)
  }
  return request<SpecialistCard>('GET', `/specialists/${id}`)
}

/** POST /me/verify (specialist) — after the ID card, license and selfie checks pass. */
export function verifyMe(body: VerifyBody): Promise<SpecialistCard> {
  if (USE_MOCKS) {
    const s = specialists.find((x) => x.id === meSpecialist.id)
    if (s) s.verified = true
    return s ? mock(s, 900) : mockError('not_found', 'Specialist not found', 404)
  }
  return request<SpecialistCard>('POST', '/me/verify', body)
}

/** GET /takeaways/latest (patient) — the specialist's note after the last session, or null. */
export function getLatestTakeaways(): Promise<Takeaways | null> {
  if (USE_MOCKS) return mock(takeaways)
  return request<Takeaways | null>('GET', '/takeaways/latest')
}
