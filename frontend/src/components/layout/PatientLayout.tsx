/** Patient shell. Phone: column + floating bottom navigation, each screen draws its own top bar.
 * Desktop (>= 1024 px, design D01–D08): top header with pill navigation, SOS and avatar over the page's Hero. Dhia owns this file. */
import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { ClipboardCheck, Heart, MessageSquare, Smile, UserRound } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getHomework } from '@/api'
import { useAuth } from '@/auth/AuthContext'
import { LogoGlyph } from '@/components/t4h/kit'
import { initials } from '@/lib/format'

const tabs = [
  { to: '/patient', label: 'Chat', icon: MessageSquare, end: true, fill: true },
  { to: '/patient/checkin', label: 'Check-in', icon: Smile, fill: false },
  { to: '/patient/homework', label: 'Homework', icon: ClipboardCheck, fill: false },
  { to: '/patient/questionnaire', label: 'Check-up', icon: Heart, fill: true },
  { to: '/patient/settings', label: 'Settings', icon: UserRound, fill: true },
]

export function PatientLayout() {
  const { me } = useAuth()
  const { pathname } = useLocation()
  const [todo, setTodo] = useState(0)

  useEffect(() => {
    getHomework()
      .then((h) => setTodo(h.filter((x) => !x.done).length))
      .catch(() => {})
  }, [pathname])

  return (
    <div className="relative mx-auto flex min-h-svh max-w-[430px] flex-col bg-background lg:max-w-none">
      <header className="absolute inset-x-0 top-0 z-30 mx-auto hidden max-w-[1216px] items-center justify-between px-6 pt-6 lg:flex">
        <Link to="/patient" className="flex items-center gap-3">
          <span className="flex size-[46px] items-center justify-center rounded-full bg-white/70 text-ink shadow-[var(--shadow-soft)]">
            <LogoGlyph className="size-5" />
          </span>
          <span className="text-[19px] tracking-[-0.3px]">Tech4Health</span>
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 rounded-full bg-white/70 p-1 shadow-[var(--shadow-float)] backdrop-blur">
          {tabs.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => cn('flex h-[42px] items-center gap-2 rounded-full px-5 text-[15px] transition', isActive ? 'bg-ink text-white' : 'text-ink-2 hover:text-ink')}>
              {label}
              {to === '/patient/homework' && todo > 0 && <span className="flex size-5 items-center justify-center rounded-full bg-ink text-[11px] text-white ring-2 ring-white">{todo}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2.5">
          <Link to="/patient/sos" aria-label="SOS: alert my specialist" className="flex h-[46px] items-center gap-2 rounded-full bg-sos px-5 text-[14px] font-semibold text-white shadow-[0_10px_24px_rgba(200,54,45,.3)] hover:brightness-110">
            <Heart className="size-4" fill="currentColor" /> SOS
          </Link>
          <Link to="/patient/settings" aria-label="Settings" className="flex size-[46px] items-center justify-center rounded-full bg-[linear-gradient(140deg,#F9E4BB,#FBD7C8)] text-[14px]">
            {initials(me?.nickname ?? '')}
          </Link>
        </div>
      </header>
      <main className="flex-1 pb-[104px] lg:pb-0">
        <Outlet />
      </main>
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[430px] border-t border-line/60 bg-[#FAFAFB]/95 backdrop-blur lg:hidden">
        <ul className="grid h-[88px] grid-cols-5 items-center px-3">
          {tabs.map(({ to, label, icon: Icon, end, fill }) => (
            <li key={to} className="flex justify-center">
              <NavLink to={to} end={end} aria-label={label} title={label}>
                {({ isActive }) => (
                  <span
                    className={cn(
                      'flex size-[52px] items-center justify-center rounded-full transition',
                      isActive ? '-translate-y-1 bg-white text-ink shadow-[0_10px_26px_rgba(40,30,70,.14)]' : 'text-[#6B6A72] hover:text-ink',
                    )}
                  >
                    <Icon className="size-[22px]" fill={isActive && fill ? 'currentColor' : 'none'} strokeWidth={isActive ? (fill ? 1.5 : 2.3) : 1.9} />
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
