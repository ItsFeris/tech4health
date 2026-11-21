import type { Me, PatientOnboardingBody, SpecialistOnboardingBody, Consent } from '@/types/contract'
import { USE_MOCKS, mock, mockError, request } from './client'
import { getMockRole } from './mockSession'
import { mePatient, meSpecialist } from '@/mocks/me'

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
    return mock(mePatient)
  }
  return request<Me>('POST', '/onboarding/patient', body)
}

/** POST /onboarding/specialist */
export function onboardSpecialist(body: SpecialistOnboardingBody): Promise<Me> {
  if (USE_MOCKS) {
    Object.assign(meSpecialist, { nickname: body.nickname, language: body.language })
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
