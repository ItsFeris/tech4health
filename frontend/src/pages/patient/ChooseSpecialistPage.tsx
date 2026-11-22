// Patient without a specialist (left one, or none was assigned): choose one before using the app (design D00 / onboarding step 3).
import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { setMySpecialist } from '@/api'
import { useAuth } from '@/auth/AuthContext'
import type { SpecialistCard } from '@/types/contract'
import { Cta, GlassCircle, Headline, Hero, Notice, SosButton } from '@/components/t4h/kit'
import { shortName } from '@/components/t4h/specialist'
import { SpecialistPicker } from '@/components/t4h/SpecialistPicker'

export default function ChooseSpecialistPage() {
  const navigate = useNavigate()
  const { me, refresh, logout } = useAuth()
  const left = (useLocation().state as { left?: string } | null)?.left ?? null
  const [chosen, setChosen] = useState<SpecialistCard | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (me?.specialist_id && !busy) return <Navigate to="/patient" replace />

  async function confirm() {
    if (!chosen) return
    setBusy(true)
    setError(null)
    try {
      await setMySpecialist(chosen.id)
      await refresh()
      navigate('/patient', { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your choice. Try again.')
      setBusy(false)
    }
  }

  return (
    <div className="relative mx-auto flex min-h-svh max-w-[430px] flex-col overflow-hidden lg:max-w-none">
      <Hero tone="peach" variant="petals" />
      <div className="relative z-10 flex flex-1 flex-col px-5 pb-7 pt-6 lg:mx-auto lg:w-full lg:max-w-[1180px] lg:px-6">
        <div className="flex items-center justify-between">
          <GlassCircle aria-label="Log out" onClick={() => void logout()}>
            <LogOut className="size-5" />
          </GlassCircle>
          <SosButton />
        </div>
        <section className="mt-8 flex flex-col gap-3">
          <Headline eyebrow={left ? 'You left your specialist' : `You don't have a specialist yet, ${me?.nickname ?? ''}`} title="Choose your specialist" />
          <p className="text-center text-[14.5px] text-ink-2">One weekly session with them, Nour in between. You can change anytime in Settings.</p>
          <SpecialistPicker value={chosen} onChange={setChosen} exclude={left} emptyHint="Try again a bit later. SOS still works." />
        </section>
        <div className="mt-auto flex flex-col gap-3 pt-8 lg:ml-auto lg:w-[420px]">
          {error && <Notice tone="error">{error}</Notice>}
          <Cta onClick={() => void confirm()} disabled={!chosen} loading={busy}>
            {chosen ? `Continue with ${shortName(chosen.nickname)}` : 'Choose a specialist'}
          </Cta>
        </div>
      </div>
    </div>
  )
}
