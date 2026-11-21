/** Specialist shell: top bar with live alert counter. DHIA ONLY. */
import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { Bell, LogOut, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/auth/AuthContext'
import { getAlerts, subscribeToAlerts } from '@/api'
import type { Alert } from '@/types/contract'
import { cn } from '@/lib/utils'

export function SpecialistLayout() {
  const { me, logout } = useAuth()
  const [openAlerts, setOpenAlerts] = useState(0)
  const [toast, setToast] = useState<Alert | null>(null)

  useEffect(() => {
    getAlerts('open').then((a) => setOpenAlerts(a.length)).catch(() => {})
    return subscribeToAlerts((alert) => {
      setOpenAlerts((n) => n + 1)
      setToast(alert)
    })
  }, [])

  const link = ({ isActive }: { isActive: boolean }) =>
    cn('flex items-center gap-2 rounded-md px-3 py-1.5 text-sm', isActive ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground hover:text-foreground')

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-6">
          <span className="font-semibold">Tech4Health · Specialist</span>
          <nav className="flex gap-1">
            <NavLink to="/specialist" end className={link}>
              <Users className="size-4" /> Patients
            </NavLink>
            <NavLink to="/specialist/alerts" className={link}>
              <Bell className="size-4" /> Alerts
              {openAlerts > 0 && <Badge variant="red">{openAlerts}</Badge>}
            </NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">{me?.nickname}</span>
          <Button variant="ghost" size="icon" onClick={() => void logout()} aria-label="Log out">
            <LogOut />
          </Button>
        </div>
      </header>
      {toast && (
        <div className="border-destructive/30 bg-destructive/10 text-destructive flex items-center justify-between border-b px-6 py-2 text-sm">
          <span>
            <strong>New {toast.level} alert</strong> — {toast.patient_nickname}: {toast.reason}
          </span>
          <Button variant="ghost" size="sm" onClick={() => setToast(null)}>
            Dismiss
          </Button>
        </div>
      )}
      <main className="mx-auto w-full max-w-6xl flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}
