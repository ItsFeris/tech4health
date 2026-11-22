import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Heart, Phone, ShieldAlert, Sparkles, Wind } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { sendSos } from '@/api'
import type { Crisis } from '@/types/contract'
import { crisis as defaultCrisis } from '@/mocks/crisis'
import { cn } from '@/lib/utils'

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

  // Breathing Box Timer: 4s Inspire -> 4s Hold -> 4s Expire
  useEffect(() => {
    if (!breathingActive) return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev > 1) return prev - 1
        // Change phase
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

  return (
    <div className="flex min-h-svh flex-col justify-between bg-gradient-to-b from-rose-50/50 via-background to-background p-6">
      {/* Top Warning Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-rose-600 font-semibold text-xs">
          <ShieldAlert className="size-5" />
          <span>Espace de soutien d'urgence</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="rounded-xl text-muted-foreground"
          onClick={() => navigate('/patient')}
        >
          <ArrowLeft className="mr-1 size-4" /> Quitter
        </Button>
      </div>

      {/* Main Content or Breathing Box */}
      {breathingActive ? (
        <div className="flex flex-col items-center justify-center text-center my-auto py-8">
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">
            Respiration apaisante (4-4-4)
          </span>

          {/* Animated Circle */}
          <div className="relative my-8 flex size-52 items-center justify-center">
            <div
              className={cn(
                'absolute size-full rounded-full bg-primary/10 transition-transform duration-1000 ease-in-out',
                breathPhase === 'inspire' ? 'scale-110 bg-primary/20' : breathPhase === 'bloque' ? 'scale-110' : 'scale-90 bg-primary/5'
              )}
            />
            <div className="flex flex-col items-center justify-center">
              <Wind className="mb-2 size-8 text-primary animate-pulse" />
              <span className="font-serif text-2xl font-bold text-foreground capitalize">
                {breathPhase === 'inspire' ? 'Inspirez...' : breathPhase === 'bloque' ? 'Retenez...' : 'Expirez...'}
              </span>
              <span className="font-mono text-3xl font-extrabold text-primary mt-1">{countdown}s</span>
            </div>
          </div>

          <p className="text-muted-foreground text-xs max-w-xs leading-relaxed">
            Concentrez-vous sur l'air qui entre et sort de vos poumons. Votre corps retrouve son rythme naturel.
          </p>

          <Button
            variant="outline"
            className="mt-6 rounded-2xl"
            onClick={() => setBreathingActive(false)}
          >
            Revenir aux options d'assistance
          </Button>
        </div>
      ) : (
        <div className="flex flex-col my-auto py-4">
          <div className="mb-3 flex size-14 items-center justify-center rounded-3xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
            <Heart className="size-7 fill-rose-600 dark:fill-rose-400" />
          </div>

          <h1 className="font-serif text-3xl font-bold text-foreground tracking-tight">
            {crisisData.title}
          </h1>

          <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
            {crisisData.body}
          </p>

          {sosSent && (
            <div className="mt-4 rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
              Votre spécialiste a bien reçu le rappel d'alerte.
            </div>
          )}

          {/* Action Buttons from Contract */}
          <div className="mt-8 flex flex-col gap-3">
            {crisisData.actions.map((act) => (
              <Button
                key={act.label}
                size="lg"
                variant={act.kind === 'call' ? 'destructive' : act.kind === 'sos' ? 'default' : 'secondary'}
                disabled={sosSending && act.kind === 'sos'}
                onClick={() => void handleActionClick(act)}
                className="h-14 rounded-2xl text-base shadow-sm justify-start px-5"
              >
                {act.kind === 'call' && <Phone className="mr-3 size-5" />}
                {act.kind === 'sos' && <ShieldAlert className="mr-3 size-5" />}
                {act.kind === 'breathing' && <Sparkles className="mr-3 size-5 text-primary" />}
                <span>{act.label}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Safety Footer */}
      <div className="rounded-2xl bg-muted/40 p-3 text-center text-[11px] text-muted-foreground">
        En cas de danger vital immédiat, composez directement le <strong>190</strong> (Samu Tunisie) ou le <strong>15</strong> (France).
      </div>
    </div>
  )
}
