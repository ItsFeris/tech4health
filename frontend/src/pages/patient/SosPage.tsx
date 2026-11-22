import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowLeft, HeartHandshake, PhoneCall, ShieldAlert, Wind } from 'lucide-react'
import { sendSos } from '@/api'

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
  redLight: '#F5E8E8',
}

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
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi de l'alerte.")
      setBusy(false)
    }
  }

  return (
    <div
      className="flex flex-col px-5 pt-5 pb-8 gap-5"
      style={{ backgroundColor: C.bg, minHeight: '100%', fontFamily: 'sans-serif' }}
    >
      {/* Header */}
      <div
        className="rounded-3xl border p-5 text-center"
        style={{ borderColor: '#D4A0A0', backgroundColor: C.redLight }}
      >
        <div
          className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full"
          style={{ backgroundColor: '#E8C0C0' }}
        >
          <ShieldAlert className="size-7 animate-pulse" style={{ color: C.red }} />
        </div>
        <h1
          className="text-2xl font-bold"
          style={{ color: C.red, fontFamily: 'Georgia, serif' }}
        >
          Besoin d'aide immédiate ?
        </h1>
        <p className="mt-1 text-xs leading-relaxed" style={{ color: '#7A5A5A' }}>
          Vous n'êtes pas seul(e). Des solutions existent et nous sommes là pour vous orienter.
        </p>
      </div>

      {error && (
        <div
          className="flex items-center gap-2 rounded-2xl border p-3 text-xs"
          style={{ borderColor: '#D4A0A0', backgroundColor: C.redLight, color: C.red }}
        >
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main action */}
      <div
        className="rounded-3xl border p-5 text-center"
        style={{ borderColor: '#D4A0A0', backgroundColor: C.cream }}
      >
        <HeartHandshake className="mx-auto mb-3 size-8" style={{ color: C.red }} />
        <h2 className="text-base font-bold" style={{ color: C.dark, fontFamily: 'Georgia, serif' }}>
          Alerter mon spécialiste en urgence
        </h2>
        <p className="mt-1 text-xs leading-relaxed" style={{ color: C.muted }}>
          Une alerte prioritaire sera immédiatement envoyée sur le tableau de bord de votre médecin/psychologue.
        </p>
        <button
          disabled={busy}
          onClick={() => void handleAlertSpecialist()}
          className="mt-4 w-full rounded-2xl py-4 text-sm font-bold shadow-lg transition-all hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: C.red, color: C.cream }}
        >
          {busy ? "Envoi de l'alerte..." : 'Alerter mon spécialiste maintenant'}
        </button>
      </div>

      {/* Breathing exercise */}
      <button
        onClick={() => navigate('/patient/crisis', { state: { directBreathing: true } })}
        className="flex items-center gap-4 rounded-2xl border p-4 text-left transition-all hover:scale-[1.01]"
        style={{ borderColor: C.sageLight, backgroundColor: C.cream }}
      >
        <div
          className="flex size-11 shrink-0 items-center justify-center rounded-2xl"
          style={{ backgroundColor: C.sageLight }}
        >
          <Wind className="size-5" style={{ color: C.dark }} />
        </div>
        <div>
          <h3 className="font-semibold text-sm" style={{ color: C.dark }}>
            Exercice de respiration anti-panique
          </h3>
          <p className="text-xs" style={{ color: C.muted }}>
            Prenez 2 minutes pour calmer les battements de votre cœur.
          </p>
        </div>
      </button>

      {/* Emergency numbers */}
      <div
        className="rounded-2xl border p-4"
        style={{ borderColor: C.sageLight, backgroundColor: C.cream }}
      >
        <div className="flex items-center gap-2 mb-2">
          <PhoneCall className="size-4" style={{ color: C.dark }} />
          <span className="text-xs font-bold" style={{ color: C.dark }}>
            Numéros d'urgence gratuits 24h/24
          </span>
        </div>
        <div className="space-y-1.5 text-[11px]" style={{ color: C.muted }}>
          <p>• <strong style={{ color: C.dark }}>Samu :</strong> 190 (Tunisie) / 15 (France)</p>
          <p>• <strong style={{ color: C.dark }}>Protection Civile :</strong> 198 (Tunisie) / 18 (France)</p>
          <p>• <strong style={{ color: C.dark }}>Écoute & Détresse :</strong> 3114 (France)</p>
        </div>
      </div>

      {/* Back */}
      <button
        className="flex items-center gap-2 self-center rounded-xl px-4 py-2.5 text-xs"
        style={{ color: C.muted }}
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="size-3.5" /> Retourner à l'application
      </button>
    </div>
  )
}
