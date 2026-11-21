// Fixed fake ids used across all mocks. DHIA ONLY.
export const SPECIALIST_ID = '00000000-0000-4000-8000-000000000001'
export const PATIENT_A_ID = '00000000-0000-4000-8000-0000000000a1' // stable
export const PATIENT_B_ID = '00000000-0000-4000-8000-0000000000b1' // falling mood, open orange alert
export const PATIENT_C_ID = '00000000-0000-4000-8000-0000000000c1' // fresh, used for the live crisis demo

/** ISO timestamp `days` days from now (negative = past), at the given hour UTC. */
export function daysFromNow(days: number, hour = 10): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + days)
  d.setUTCHours(hour, 0, 0, 0)
  return d.toISOString()
}

/** YYYY-MM-DD `days` days from now. */
export function dateFromNow(days: number): string {
  return daysFromNow(days).slice(0, 10)
}

/** Monday of the current week, YYYY-MM-DD. */
export function thisMonday(): string {
  const d = new Date()
  const diff = (d.getUTCDay() + 6) % 7
  d.setUTCDate(d.getUTCDate() - diff)
  return d.toISOString().slice(0, 10)
}
