import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowLeft, HeartHandshake, PhoneCall, ShieldAlert, Wind } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { sendSos } from '@/api'

export default function SosPage() {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAlertSpecialist() {
    setBusy(true)
    setError(null)
    try {
      const reply = await sendSos()
      navigate('/patient/crisis', { state: { crisis: reply.crisis }, replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi de l\'alerte.')
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Header */}
      <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-5 text-center">
        <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-destructive/15 text-destructive">
          <ShieldAlert className="size-6 animate-pulse" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-destructive">Besoin d'aide immédiate ?</h1>
        <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
          Vous n'êtes pas seul(e). Des solutions existent et nous sommes là pour vous orienter.
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive flex items-center gap-2 rounded-2xl p-3 text-xs">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Action: Alert Specialist */}
      <Card className="rounded-3xl border-destructive/30 bg-card p-5 shadow-sm">
        <CardContent className="flex flex-col items-center gap-3 p-0 text-center">
          <HeartHandshake className="size-8 text-destructive" />
          <h2 className="font-semibold text-base text-foreground">
            Alerter mon spécialiste en urgence
          </h2>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Une alerte rouge prioritaire sera immédiatement envoyée sur le tableau de bord de votre médecin/psychologue.
          </p>
          <Button
            variant="destructive"
            size="lg"
            disabled={busy}
            onClick={() => void handleAlertSpecialist()}
            className="mt-2 w-full rounded-2xl text-base shadow-lg shadow-destructive/25"
          >
            {busy ? 'Envoi de l\'alerte...' : 'Alerter mon spécialiste maintenant'}
          </Button>
        </CardContent>
      </Card>

      {/* Immediate Breathing Exercise */}
      <Card
        onClick={() => navigate('/patient/crisis', { state: { directBreathing: true } })}
        className="cursor-pointer rounded-2xl border border-primary/30 bg-primary/5 p-4 transition-all hover:bg-primary/10"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
            <Wind className="size-5" />
          </div>
          <div>
            <h3 className="font-medium text-xs text-foreground">Exercice de respiration anti-panique</h3>
            <p className="text-muted-foreground text-[11px]">
              Prenez 2 minutes pour calmer les battements de votre cœur.
            </p>
          </div>
        </div>
      </Card>

      {/* Emergency Phone numbers */}
      <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 text-xs">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <PhoneCall className="size-4 text-primary" />
          <span>Numéros d'urgence gratuits 24h/24</span>
        </div>
        <div className="mt-2 space-y-1.5 text-muted-foreground text-[11px]">
          <p>• <strong>Samu :</strong> 190 (Tunisie) / 15 (France)</p>
          <p>• <strong>Protection Civile :</strong> 198 (Tunisie) / 18 (France)</p>
          <p>• <strong>Écoute & Détresse :</strong> 3114 (France)</p>
        </div>
      </div>

      {/* Cancel / Back */}
      <Button
        variant="ghost"
        className="rounded-xl text-muted-foreground"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="mr-2 size-4" /> Retourner à l'application
      </Button>
    </div>
  )
}
