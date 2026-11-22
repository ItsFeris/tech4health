/** Patient shell: phone-width column + floating bottom navigation. Each screen draws its own top bar. Dhia owns this file. */
import { NavLink, Outlet } from 'react-router-dom'
import { ClipboardCheck, Heart, MessageSquare, Smile, UserRound } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { to: '/patient', label: 'Chat', icon: MessageSquare, end: true, fill: true },
  { to: '/patient/checkin', label: 'Check-in', icon: Smile, fill: false },
  { to: '/patient/homework', label: 'Homework', icon: ClipboardCheck, fill: false },
  { to: '/patient/questionnaire', label: 'Check-up', icon: Heart, fill: true },
  { to: '/patient/settings', label: 'Settings', icon: UserRound, fill: true },
]

export function PatientLayout() {
  return (
    <div className="relative mx-auto flex min-h-svh max-w-[430px] flex-col bg-background">
      <main className="flex-1 pb-[104px]">
        <Outlet />
      </main>
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[430px] border-t border-line/60 bg-[#FAFAFB]/95 backdrop-blur">
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
