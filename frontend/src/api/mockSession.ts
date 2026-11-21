/** Which demo user is logged in when VITE_USE_MOCKS=true. DHIA ONLY. */
import type { Role } from '@/types/contract'

const KEY = 't4h-mock-role'

export function getMockRole(): Role | null {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'patient' || v === 'specialist' ? v : null
  } catch {
    return null
  }
}

export function setMockRole(role: Role | null) {
  try {
    if (role) localStorage.setItem(KEY, role)
    else localStorage.removeItem(KEY)
  } catch {
    /* storage unavailable: session will not persist across reloads */
  }
}
