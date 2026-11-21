/** Patient shell: header with SOS button, bottom navigation. DHIA ONLY. */
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { ClipboardList, HeartPulse, ListChecks, LogOut, MessageCircle, Settings, Siren } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/auth/AuthContext'
import { cn } from '@/lib/utils'

const tabs = [
  { to: '/patient', label: 'Chat', icon: MessageCircle, end: true },
  { to: '/patient/checkin', label: 'Check-in', icon: HeartPulse },
  { to: '/patient/homework', label: 'Homework', icon: ListChecks },
  { to: '/patient/questionnaire', label: 'Check-up', icon: ClipboardList },
  { to: '/patient/settings', label: 'Settings', icon: Settings },
]

export function PatientLayout() {
  const { me, logout } = useAuth()
  const navigate = useNavigate()
  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col">
      <header className="bg-background/90 sticky top-0 z-10 flex items-center justify-between border-b px-4 py-3 backdrop-blur">
        <div>
          <p className="text-muted-foreground text-xs">Tech4Health</p>
          <p className="font-semibold">Hi {me?.nickname}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="destructive" size="sm" onClick={() => navigate('/patient/sos')} aria-label="SOS">
            <Siren /> SOS
          </Button>
          <Button variant="ghost" size="icon" onClick={() => void logout()} aria-label="Log out">
            <LogOut />
          </Button>
        </div>
      </header>
      <main className="flex-1 pb-20">
        <Outlet />
      </main>
      <nav className="bg-background fixed inset-x-0 bottom-0 mx-auto grid max-w-md grid-cols-5 border-t">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => cn('flex flex-col items-center gap-1 py-2 text-xs', isActive ? 'text-primary' : 'text-muted-foreground')}
          >
            <Icon className="size-5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
