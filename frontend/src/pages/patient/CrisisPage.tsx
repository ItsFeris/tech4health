import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Heart, Phone, ShieldAlert, Sparkles, Wind } from 'lucide-react'
import { sendSos } from '@/api'
import type { Crisis } from '@/types/contract'
import { crisis as defaultCrisis } from '@/mocks/crisis'
import { cn } from '@/lib/utils'

const C = {
  bg: '#F2EFE9',
  dark: '#2C3A2C',
  darkMid: '#3D4F3D',
  sage: '#7A9A7A',
  sageMid: '#B5C9B5',
  sageLight: '#D8E5D8',
  cream: '#FAF8F4',
  muted: '#8A9A8A',
  red: '#8B4A4A',
}

export default function CrisisPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as { crisis?: Crisis; directBreathing?: boolean } | null

  const crisisData = state?.crisis ?? defaultCrisis
  const [breathingActive, setBreathingActive] = useState(Boolean(state?.directBreathing))
  const [breathPhase, setBreathPhase] = useState<'inspire' | 'bloque' | 'expire'>('inspire')
  const [countdown, setCountdown] = useState(4)
  const [sosSending, setSosSending] = useState(false)
  const [sosSent, setSosSent] = useState(false)

  useEffect(() => {
    if (!breathingActive) return
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev > 1) return prev - 1
        setBreathPhase((current) => {
          if (current === 'inspire') return 'bloque'
          if (current === 'bloque') return 'expire'
          return 'inspire'
        })
        return 4
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [breathingActive])

  async function handleActionClick(action: Crisis['actions'][number]) {
    if (action.kind === 'breathing') {
      setBreathingActive(true)
    } else if (action.kind === 'call') {
      window.location.href = 'tel:190'
    } else if (action.kind === 'sos') {
      setSosSending(true)
      try {
        await sendSos()
        setSosSent(true)
      } finally {
        setSosSending(false)
      }
    }
  }

  const phaseScale = breathPhase === 'inspire' ? 'scale-110' : breathPhase === 'bloque' ? 'scale-110' : 'scale-90'
  const phaseLabel = breathPhase === 'inspire' ? 'Inspirez...' : breathPhase === 'bloque' ? 'Retenez...' : 'Expirez...'

  return (
    <div
      className="flex min-h-svh flex-col justify-between p-6"
      style={{ backgroundColor: C.bg, fontFamily: 'sans-serif' }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: C.red }}>
          <ShieldAlert className="size-5" />
          <span>Espace de soutien d'urgence</span>
        </div>
        <button
          className="flex items-center gap-1 rounded-xl px-3 py-2 text-xs"
          style={{ color: C.muted }}
          onClick={() => navigate('/patient')}
        >
          <ArrowLeft className="size-3.5" /> Quitter
        </button>
      </div>

      {/* Main content */}
      {breathingActive ? (
        <div className="flex flex-col items-center justify-center text-center my-auto py-8">
          <span
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: C.sage }}
          >
            Respiration apaisante (4-4-4)
          </span>

          {/* Animated breathing circle */}
          <div className="relative my-8 flex size-56 items-center justify-center">
            {/* Outer ring */}
            <div
              className={cn(
                'absolute size-full rounded-full border-4 transition-transform duration-1000 ease-in-out',
                phaseScale,
              )}
              style={{ borderColor: C.sageLight }}
            />
            {/* Middle ring */}
            <div
              className={cn(
                'absolute size-4/5 rounded-full transition-transform duration-1000 ease-in-out',
                phaseScale,
              )}
              style={{
                backgroundColor: breathPhase === 'inspire'
                  ? `${C.sageMid}40`
                  : breathPhase === 'bloque'
                  ? `${C.sageMid}30`
                  : `${C.sageLight}30`,
              }}
            />
            {/* Inner circle */}
            <div
              className={cn(
                'absolute size-3/5 rounded-full transition-transform duration-1000 ease-in-out flex flex-col items-center justify-center',
                phaseScale,
              )}
              style={{ backgroundColor: C.sageLight }}
            >
              <Wind className="mb-1 size-6 animate-pulse" style={{ color: C.dark }} />
              <span
                className="text-lg font-bold"
                style={{ color: C.dark, fontFamily: 'Georgia, serif' }}
              >
                {phaseLabel}
              </span>
              <span
                className="text-2xl font-extrabold mt-0.5"
                style={{ color: C.sage, fontFamily: 'monospace' }}
              >
                {countdown}s
              </span>
            </div>
          </div>

          <p className="max-w-xs text-xs leading-relaxed" style={{ color: C.muted }}>
            Concentrez-vous sur l'air qui entre et sort de vos poumons. Votre corps retrouve son rythme naturel.
          </p>

          <button
            className="mt-6 rounded-2xl border px-6 py-3 text-sm font-semibold hover:opacity-80"
            style={{ borderColor: C.sageMid, color: C.dark, backgroundColor: C.cream }}
            onClick={() => setBreathingActive(false)}
          >
            Revenir aux options d'assistance
          </button>
        </div>
      ) : (
        <div className="flex flex-col my-auto py-4">
          <div
            className="mb-4 flex size-14 items-center justify-center rounded-3xl"
            style={{ backgroundColor: '#F5E8E8' }}
          >
            <Heart className="size-7" style={{ color: C.red, fill: C.red }} />
          </div>

          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ color: C.dark, fontFamily: 'Georgia, serif' }}
          >
            {crisisData.title}
          </h1>

          <p className="mt-3 text-sm leading-relaxed" style={{ color: C.muted }}>
            {crisisData.body}
          </p>

          {sosSent && (
            <div
              className="mt-4 rounded-2xl border p-3 text-xs"
              style={{ borderColor: C.sageMid, backgroundColor: C.sageLight, color: C.darkMid }}
            >
              Votre spécialiste a bien reçu le rappel d'alerte.
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-8 flex flex-col gap-3">
            {crisisData.actions.map((act) => (
              <button
                key={act.label}
                disabled={sosSending && act.kind === 'sos'}
                onClick={() => void handleActionClick(act)}
                className="flex h-14 items-center rounded-2xl px-5 text-sm font-bold shadow-sm transition-all hover:opacity-90 disabled:opacity-50"
                style={
                  act.kind === 'call'
                    ? { backgroundColor: C.red, color: C.cream }
                    : act.kind === 'sos'
                    ? { backgroundColor: C.dark, color: C.cream }
                    : { backgroundColor: C.sageLight, color: C.dark }
                }
              >
                {act.kind === 'call' && <Phone className="mr-3 size-5" />}
                {act.kind === 'sos' && <ShieldAlert className="mr-3 size-5" />}
                {act.kind === 'breathing' && <Sparkles className="mr-3 size-5" />}
                <span>{act.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Safety footer */}
      <div
        className="rounded-2xl p-3 text-center text-[11px]"
        style={{ backgroundColor: C.sageLight, color: C.muted }}
      >
        En cas de danger vital immédiat, composez directement le{' '}
        <strong style={{ color: C.dark }}>190</strong> (Samu Tunisie) ou le{' '}
        <strong style={{ color: C.dark }}>15</strong> (France).
      </div>
    </div>
  )
}
