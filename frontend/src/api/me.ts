import type { Me, PatientOnboardingBody, SpecialistOnboardingBody, Consent } from '@/types/contract'
import { USE_MOCKS, mock, mockError, request } from './client'
import { getMockRole } from './mockSession'
import { mePatient, meSpecialist } from '@/mocks/me'
import { specialists } from '@/mocks/specialists'

/** GET /me — throws ApiRequestError with code "not_onboarded" (404) for a new account. */
export function getMe(): Promise<Me> {
  if (USE_MOCKS) {
    const role = getMockRole()
    if (!role) return mockError('unauthorized', 'Not logged in', 401)
    return mock(role === 'patient' ? mePatient : meSpecialist)
  }
  return request<Me>('GET', '/me')
}

/** POST /onboarding/patient */
export function onboardPatient(body: PatientOnboardingBody): Promise<Me> {
  if (USE_MOCKS) {
    Object.assign(mePatient, { nickname: body.nickname, language: body.language, consent: body.consent, emergency_name: body.emergency_name ?? null })
    if (body.specialist_id && specialists.some((s) => s.id === body.specialist_id)) mePatient.specialist_id = body.specialist_id
    return mock(mePatient)
  }
  return request<Me>('POST', '/onboarding/patient', body)
}

/** POST /onboarding/specialist */
export function onboardSpecialist(body: SpecialistOnboardingBody): Promise<Me> {
  if (USE_MOCKS) {
    Object.assign(meSpecialist, { nickname: body.nickname, language: body.language })
    const card = specialists.find((s) => s.id === meSpecialist.id)
    if (card) Object.assign(card, { nickname: body.nickname, specialty: body.specialty ?? null, bio: body.bio ?? null, languages: body.languages ?? [], years: body.years ?? null, price: body.price ?? null, photo_url: body.photo_url ?? null, verified: false })
    return mock(meSpecialist)
  }
  return request<Me>('POST', '/onboarding/specialist', body)
}

/** PATCH /me/consent */
export function updateConsent(consent: Consent): Promise<Me> {
  if (USE_MOCKS) {
    mePatient.consent = consent
    return mock(mePatient)
  }
  return request<Me>('PATCH', '/me/consent', { consent })
}

/** PATCH /me/specialist (v1.5) — choose a new verified specialist, or null to leave the current one.
 * Leaving cancels upcoming sessions with them; the app then asks the patient to choose again. */
export function setMySpecialist(specialistId: string | null): Promise<Me> {
  if (USE_MOCKS) {
    mePatient.specialist_id = specialistId
    return mock(mePatient)
  }
  return request<Me>('PATCH', '/me/specialist', { specialist_id: specialistId })
}
