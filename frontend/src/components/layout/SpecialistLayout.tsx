/** Specialist shell: logo, black pill navigation, profile chip and the live crisis toast. Pages draw their own Hero. Dhia owns this file. */
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Bell, Heart, LogOut, ShieldCheck, Users } from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import { getAlerts, getSpecialist, subscribeToAlerts } from '@/api'
import type { Alert, SpecialistCard } from '@/types/contract'
import { LogoGlyph, SmallButton } from '@/components/t4h/kit'
import { SpecialistPhoto, VerifiedBadge } from '@/components/t4h/specialist'
import { cn } from '@/lib/utils'

export function SpecialistLayout() {
  const { me, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const onPatients = pathname === '/specialist' || pathname.startsWith('/specialist/patients')
  const [openAlerts, setOpenAlerts] = useState(0)
  const [toast, setToast] = useState<Alert | null>(null)
  const [card, setCard] = useState<SpecialistCard | null>(null)

  useEffect(() => {
    if (me) getSpecialist(me.id).then(setCard).catch(() => setCard(null))
  }, [me])

  useEffect(() => {
    const refresh = () => getAlerts('open').then((a) => setOpenAlerts(a.length)).catch(() => {})
    refresh()
    window.addEventListener('t4h:alerts-changed', refresh)
    const stop = subscribeToAlerts((alert) => {
      setOpenAlerts((n) => n + 1)
      setToast(alert)
      window.dispatchEvent(new CustomEvent('t4h:alert-arrived', { detail: alert }))
    })
    return () => {
      stop()
      window.removeEventListener('t4h:alerts-changed', refresh)
    }
  }, [])

  const tab = ({ isActive }: { isActive: boolean }) =>
    cn('flex h-[42px] items-center gap-2 rounded-full px-5 text-[15px] transition', isActive ? 'bg-ink text-white' : 'text-ink-2 hover:text-ink')

  return (
    <div className="relative min-h-svh">
      <header className="relative z-20 mx-auto flex max-w-[1216px] items-center justify-between px-6 pt-6">
        <NavLink to="/specialist" className="flex items-center gap-3">
          <span className="flex size-[46px] items-center justify-center rounded-full bg-white/70 text-ink shadow-[var(--shadow-soft)]">
            <LogoGlyph className="size-5" />
          </span>
          <span className="text-[19px] tracking-[-0.3px]">Mindora</span>
        </NavLink>
        <nav aria-label="Main" className="flex items-center gap-1 rounded-full bg-white/70 p-1 shadow-[var(--shadow-float)] backdrop-blur">
          <NavLink to="/specialist" end className={() => tab({ isActive: onPatients })}>
            <Users className="size-4" /> Patients
          </NavLink>
          <NavLink to="/specialist/alerts" className={tab}>
            <Bell className="size-4" /> Alerts
            {openAlerts > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-sos px-1.5 text-[11px] font-semibold text-white">{openAlerts}</span>}
          </NavLink>
        </nav>
        <div className="flex items-center gap-2">
          {card?.verified && <VerifiedBadge className="hidden h-10 px-4 text-sm sm:inline-flex" />}
          <span className="flex h-11 items-center gap-2 rounded-full bg-white/80 py-1 pl-1 pr-2 shadow-[var(--shadow-soft)]">
            <SpecialistPhoto id={me?.id ?? ''} photoUrl={card?.photo_url} name={me?.nickname ?? ''} size={36} />
            <span className="max-w-[140px] truncate text-sm">{me?.nickname}</span>
            <button type="button" onClick={() => void logout()} aria-label="Log out" className="ml-1 flex size-8 items-center justify-center rounded-full text-sub hover:bg-soft hover:text-ink">
              <LogOut className="size-4" />
            </button>
          </span>
        </div>
      </header>

      {card && !card.verified && (
        <div className="relative z-20 mx-auto mt-4 max-w-[1216px] px-6">
          <div className="flex items-center gap-3 rounded-[22px] bg-[linear-gradient(140deg,#F9E4BB_0%,#FBD7C8_100%)] px-4 py-3">
            <ShieldCheck className="size-5 shrink-0" />
            <p className="flex-1 text-[14.5px]">
              <strong className="font-semibold">Patients can&apos;t find you yet.</strong> Verify your ID and license to appear in the list (about 3 minutes).
            </p>
            <SmallButton tone="ink" onClick={() => navigate('/specialist/verify')}>
              Verify now
            </SmallButton>
          </div>
        </div>
      )}

      {toast && (
        <div role="alert" className="fixed right-6 top-24 z-40 w-[340px] rounded-[24px] bg-white p-4 shadow-[0_24px_60px_rgba(40,30,70,.18)]">
          <div className="flex gap-3">
            <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-full', toast.level === 'red' ? 'bg-sos-soft text-sos' : 'bg-warn-soft text-warn')}>
              <Heart className="size-5" fill="currentColor" />
            </span>
            <div className="min-w-0">
              <p className={cn('text-[12px]', toast.level === 'red' ? 'text-sos' : 'text-warn-deep')}>New {toast.level === 'red' ? 'crisis' : 'attention'} alert · just now</p>
              <p className="text-[15px] leading-snug">
                {toast.patient_nickname} · {toast.source === 'sos' ? 'pressed SOS' : toast.reason}
              </p>
              <div className="mt-3 flex gap-2">
                <SmallButton
                  tone="ink"
                  onClick={() => {
                    setToast(null)
                    navigate(`/specialist/patients/${toast.patient_id}`)
                  }}
                >
                  Open patient
                </SmallButton>
                <SmallButton onClick={() => setToast(null)}>Dismiss</SmallButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pages render a <Hero /> first: it sits behind this header, from the very top. */}
      <main>
        <Outlet />
      </main>
    </div>
  )
}
