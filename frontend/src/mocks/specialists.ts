import type { SpecialistCard, Takeaways } from '@/types/contract'
import { SPECIALIST_ID, daysFromNow } from './ids'

/** Verified specialists a patient can choose (v1.4). Dr. Salma is the demo specialist account. */
export const specialists: SpecialistCard[] = [
  { id: SPECIALIST_ID, nickname: 'Dr. Salma Trabelsi', specialty: 'Clinical psychologist', bio: 'I help young adults with anxiety, stress and sleep. We go at your pace.', languages: ['darija', 'fr', 'ar'], years: 12, price: 70, photo_url: null, verified: true, accepting: true },
  { id: '00000000-0000-4000-8000-000000000002', nickname: 'Dr. Hichem Bouaziz', specialty: 'Psychiatrist', bio: 'Depression, bipolar disorder and medication follow-up.', languages: ['darija', 'fr'], years: 18, price: 90, photo_url: null, verified: true, accepting: true },
  { id: '00000000-0000-4000-8000-000000000003', nickname: 'Leila Mabrouk', specialty: 'Psychotherapist', bio: 'Trauma, relationships and panic. A calm, safe space.', languages: ['darija', 'ar', 'en'], years: 9, price: 60, photo_url: null, verified: true, accepting: true },
  { id: '00000000-0000-4000-8000-000000000004', nickname: 'Dr. Omar Kallel', specialty: 'Clinical psychologist', bio: 'Exam stress, students and self-esteem.', languages: ['darija', 'fr', 'en'], years: 6, price: 50, photo_url: null, verified: true, accepting: true },
]

export const takeaways: Takeaways = {
  appointment_id: 'appt-past-c',
  session_date: daysFromNow(-4, 15),
  takeaways: "Small steps count. If the breathing feels awkward at first, that's normal: try it just once a day and tell me how it went.",
}
