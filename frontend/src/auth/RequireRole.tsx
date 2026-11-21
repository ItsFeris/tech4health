/** Route guard. DHIA ONLY. */
import { Navigate, Outlet } from 'react-router-dom'
import type { Role } from '@/types/contract'
import { useAuth } from './AuthContext'
import { FullPageSpinner } from '@/components/StateViews'

export function RequireRole({ role }: { role: Role }) {
  const { me, loading, needsOnboarding } = useAuth()
  if (loading) return <FullPageSpinner />
  if (needsOnboarding === role) return <Navigate to={`/${role}/onboarding`} replace />
  if (!me) return <Navigate to="/login" replace />
  if (me.role !== role) return <Navigate to={`/${me.role}`} replace />
  return <Outlet />
}

export function HomeRedirect() {
  const { me, loading, needsOnboarding } = useAuth()
  if (loading) return <FullPageSpinner />
  if (needsOnboarding) return <Navigate to={`/${needsOnboarding}/onboarding`} replace />
  return <Navigate to={me ? `/${me.role}` : '/login'} replace />
}
