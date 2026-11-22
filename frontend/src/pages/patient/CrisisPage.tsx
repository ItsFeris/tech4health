// Crisis screen (design: 8 · Crisis screen). Full screen, calm, three big actions.
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Heart, Phone, Wind } from 'lucide-react'
import { sendSos } from '@/api'
import type { Crisis } from '@/types/contract'
import { crisis as fallbackCrisis } from '@/mocks/crisis'
import { GlassCircle, Notice } from '@/components/t4h/kit'
import { cn } from '@/lib/utils'

const EMERGENCY_NUMBER = '190' // SAMU Tunisia
const PHASES = [
  { label: 'Breathe in', secs: 4, scale: 'scale-110' },
  { label: 'Hold', secs: 4, scale: 'scale-110' },
  { label: 'Breathe out', secs: 6, scale: 'scale-[0.82]' },
] as const

export default function CrisisPage() {
  const navigate = useNavigate()
  const state = useLocation().state as { crisis?: Crisis; alerted?: boolean } | null
  const crisis = state?.crisis ?? fallbackCrisis
  const [alerted, setAlerted] = useState(state?.alerted ?? Boolean(state?.crisis))
  const [sending, setSending] = useState(false)
  const [sosError, setSosError] = useState(false)
  const [breathing, setBreathing] = useState(false)
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    if (!breathing) return
    const t = setTimeout(() => setPhase((p) => (p + 1) % PHASES.length), PHASES[phase].secs * 1000)
    return () => clearTimeout(t)
  }, [breathing, phase])

  const label = (kind: 'call' | 'sos' | 'breathing', fallback: string) => crisis.actions.find((a) => a.kind === kind)?.label ?? fallback

  async function alertAgain() {
    setSending(true)
    setSosError(false)
    try {
      await sendSos()
      setAlerted(true)
    } catch {
      setSosError(true)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="relative mx-auto flex min-h-svh max-w-[430px] flex-col overflow-hidden" style={{ background: 'linear-gradient(180deg, #BFE3EA 0%, #DCEEF2 38%, #E6E1F7 78%, #F3E3EE 100%)' }}>
      <div aria-hidden="true" className="absolute -left-24 -top-20 size-[280px] rounded-full border border-white/60 bg-white/20" />
      <div aria-hidden="true" className="absolute -bottom-10 -right-24 size-[300px] rounded-[100%_0_100%_0] border border-white/60 bg-white/20" />

      <div className="relative z-10 flex flex-1 flex-col px-5 pb-7 pt-6">
        <div className="flex items-center justify-between">
          <GlassCircle aria-label="Back to Nour" onClick={() => navigate('/patient')}>
            <ArrowLeft className="size-5" />
          </GlassCircle>
          <span className={cn('flex h-[38px] items-center gap-2 rounded-full bg-white px-4 text-[14px] shadow-[var(--shadow-float)] transition', !alerted && 'opacity-0')} aria-live="polite">
            <span className="flex size-5 items-center justify-center rounded-full bg-ok text-white">
              <Check className="size-3" />
            </span>
            Specialist alerted
          </span>
          <span className="w-[52px]" />
        </div>

        <button
          type="button"
          onClick={() => setBreathing((b) => !b)}
          aria-label={breathing ? 'Stop breathing exercise' : 'Start breathing exercise'}
          className={cn(
            'mx-auto mt-14 flex size-[132px] items-center justify-center rounded-full bg-white px-5 text-center text-[16px] leading-tight shadow-[0_20px_50px_rgba(40,30,70,.12)] transition-transform ease-in-out',
            breathing ? PHASES[phase].scale : 'scale-100',
          )}
          style={{ transitionDuration: breathing ? `${PHASES[phase].secs}s` : '300ms' }}
        >
          {breathing ? PHASES[phase].label : 'Breathe with me'}
        </button>

        <h1 dir="auto" className="headline mt-14 text-center text-[42px]">
          {crisis.title}
        </h1>
        <p dir="auto" className="mt-3 text-center text-[16px] leading-relaxed text-ink-2">
          {crisis.body}
        </p>

        <div className="mt-auto flex flex-col gap-3 pt-8">
          {sosError && (
            <Notice tone="error">
              The alert could not be sent. Call <strong>{EMERGENCY_NUMBER}</strong> now, or try again.
            </Notice>
          )}
          <a href={`tel:${EMERGENCY_NUMBER}`} className="flex h-[60px] items-center justify-between rounded-full bg-ink pl-6 pr-2 text-[17px] text-white">
            <span className="flex items-center gap-3">
              <Phone className="size-5" /> <span dir="auto">{label('call', 'Call emergency services')}</span>
            </span>
            <span className="flex size-12 items-center justify-center rounded-full bg-white text-[15px] font-semibold text-ink">{EMERGENCY_NUMBER}</span>
          </a>
          <button type="button" disabled={sending} onClick={() => void alertAgain()} className="flex h-[60px] items-center justify-center gap-2 rounded-full bg-white text-[17px] shadow-[var(--shadow-float)] disabled:opacity-60">
            <Heart className="size-4 text-sos" fill="currentColor" /> <span dir="auto">{sending ? 'Sending…' : label('sos', 'Alert my specialist again')}</span>
          </button>
          <button type="button" onClick={() => setBreathing((b) => !b)} className="flex h-[60px] items-center justify-center gap-2 rounded-full border border-white/80 bg-white/40 text-[17px]">
            <Wind className="size-5" /> <span dir="auto">{breathing ? 'Stop breathing' : label('breathing', 'Breathe with me')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
