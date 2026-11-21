/** Login state for the whole app. DHIA ONLY. Pages use: const { me, logout } = useAuth() */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Me, Role } from '@/types/contract'
import { ApiRequestError, USE_MOCKS, getMe } from '@/api'
import { setTokenGetter } from '@/api/client'
import { getMockRole, setMockRole } from '@/api/mockSession'
import { supabase } from '@/lib/supabase'

interface AuthState {
  me: Me | null
  loading: boolean
  /** Set when the account exists but has no profile yet: send the user to that role's onboarding page. */
  needsOnboarding: Role | null
  loginDemo: (role: Role) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, role: Role) => Promise<void>
  logout: () => Promise<void>
  /** Call after onboarding or a profile change to reload `me`. Returns the new value. */
  refresh: () => Promise<Me | null>
}

const AuthContext = createContext<AuthState | null>(null)

/** True when login uses the demo buttons: mock mode, or real backend in DEMO mode (no Supabase keys). */
// eslint-disable-next-line react-refresh/only-export-components
export const DEMO_LOGIN = USE_MOCKS || !supabase

setTokenGetter(async () => {
  if (supabase) {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token ?? null
  }
  // Backend in DEMO mode accepts "demo-patient" / "demo-specialist".
  const role = getMockRole()
  return role ? `demo-${role}` : null
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null)
  const [loading, setLoading] = useState(true)
  const [needsOnboarding, setNeedsOnboarding] = useState<Role | null>(null)

  const refresh = useCallback(async (): Promise<Me | null> => {
    setLoading(true)
    try {
      const next = await getMe()
      setMe(next)
      setNeedsOnboarding(null)
      return next
    } catch (e) {
      setMe(null)
      if (e instanceof ApiRequestError && e.code === 'not_onboarded' && supabase) {
        const { data } = await supabase.auth.getUser()
        const role = data.user?.user_metadata?.role
        setNeedsOnboarding(role === 'specialist' ? 'specialist' : 'patient')
      } else {
        setNeedsOnboarding(null)
      }
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
    if (!supabase) return
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') void refresh()
    })
    return () => data.subscription.unsubscribe()
  }, [refresh])

  const value = useMemo<AuthState>(
    () => ({
      me,
      loading,
      needsOnboarding,
      refresh,
      async loginDemo(role) {
        setMockRole(role)
        if (!(await refresh())) {
          setMockRole(null)
          throw new Error('Could not log in: is the backend running (uvicorn) and VITE_API_URL correct?')
        }
      },
      async login(email, password) {
        if (!supabase) throw new Error('Supabase is not configured. Use the demo buttons or set VITE_USE_MOCKS=false and the Supabase keys.')
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        await refresh()
      },
      async signup(email, password, role) {
        if (!supabase) throw new Error('Supabase is not configured.')
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { role } } })
        if (error) throw error
        await refresh()
      },
      async logout() {
        if (DEMO_LOGIN) setMockRole(null)
        else await supabase?.auth.signOut()
        setMe(null)
        setNeedsOnboarding(null)
      },
    }),
    [me, loading, needsOnboarding, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
