import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Heart, Lock, ShieldCheck, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { onboardPatient } from '@/api'
import { useAuth } from '@/auth/AuthContext'
import type { Consent, Lang } from '@/types/contract'


const languages: { code: Lang; label: string; flag: string; desc: string }[] = [
  { code: 'darija', label: 'Tounsi / Darija', flag: '🇹🇳', desc: 'B tounsi kima tehki dima' },
  { code: 'fr', label: 'Français', flag: '🇫🇷', desc: 'Échangez en français' },
  { code: 'ar', label: 'العربية', flag: '🌙', desc: 'باللغة العربية الفصحى' },
  { code: 'en', label: 'English', flag: '🇬🇧', desc: 'Communicate in English' },
]

// Velora palette
const C = {
  bg: '#F2EFE9',
  dark: '#2C3A2C',
  darkMid: '#3D4F3D',
  sage: '#7A9A7A',
  sageMid: '#B5C9B5',
  sageLight: '#D8E5D8',
  cream: '#FAF8F4',
  muted: '#8A9A8A',
}

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { refresh } = useAuth()

  const [step, setStep] = useState<number>(0)
  const [nickname, setNickname] = useState('')
  const [language, setLanguage] = useState<Lang>('darija')
  const [consent, setConsent] = useState<Consent>('summary_only')
  const [emergencyName, setEmergencyName] = useState('')
  const [emergencyEmail, setEmergencyEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFinish() {
    if (!nickname.trim()) {
      setStep(1)
      setError('Veuillez choisir un pseudo.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await onboardPatient({
        nickname: nickname.trim(),
        language,
        consent,
        emergency_name: emergencyName.trim() || null,
        emergency_email: emergencyEmail.trim() || null,
      })
      await refresh()
      navigate('/patient', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="flex min-h-svh flex-col items-center justify-center p-5"
      style={{ backgroundColor: C.bg, fontFamily: "'Georgia', serif" }}
    >
      {/* Organic background shapes */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -top-20 -left-20 size-72 rounded-full opacity-30"
          style={{ backgroundColor: C.sageMid }}
        />
        <div
          className="absolute -bottom-16 -right-16 size-56 rounded-full opacity-20"
          style={{ backgroundColor: C.sageLight }}
        />
        <div
          className="absolute top-1/2 left-1/3 size-40 rounded-full opacity-15"
          style={{ backgroundColor: C.sageMid }}
        />
      </div>

      <div
        className="relative w-full max-w-sm overflow-hidden rounded-3xl p-7 shadow-2xl"
        style={{ backgroundColor: C.cream }}
      >
        {/* Progress dots */}
        <div className="mb-7 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: step === i ? 24 : 8,
                  backgroundColor: i <= step ? C.dark : C.sageLight,
                }}
              />
            ))}
          </div>
          <span className="text-xs" style={{ color: C.muted, fontFamily: 'sans-serif' }}>
            {step + 1} / 4
          </span>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-700" style={{ fontFamily: 'sans-serif' }}>
            {error}
          </div>
        )}

        {/* STEP 0: Welcome */}
        {step === 0 && (
          <div className="flex flex-col items-center text-center">
            {/* Landscape illustration */}
            <div className="mb-6 w-full overflow-hidden rounded-2xl" style={{ height: 160, backgroundColor: C.sageLight }}>
              <svg viewBox="0 0 320 160" className="size-full">
                {/* Sky */}
                <rect width="320" height="160" fill="#D8E5D8" />
                {/* Sun */}
                <circle cx="160" cy="75" r="38" fill="#F2EFE9" opacity="0.8" />
                {/* Hills */}
                <ellipse cx="80" cy="160" rx="130" ry="80" fill="#B5C9B5" opacity="0.7" />
                <ellipse cx="260" cy="160" rx="120" ry="70" fill="#7A9A7A" opacity="0.5" />
                <ellipse cx="160" cy="160" rx="180" ry="60" fill="#2C3A2C" opacity="0.15" />
                {/* Leaf */}
                <path d="M148 40 Q160 20 172 40 Q160 55 148 40Z" fill="#2C3A2C" opacity="0.4" />
                <line x1="160" y1="40" x2="160" y2="60" stroke="#2C3A2C" strokeWidth="1.5" opacity="0.4" />
              </svg>
            </div>

            <h1 className="text-3xl font-bold tracking-tight" style={{ color: C.dark }}>
              Tech4Health
            </h1>
            <p className="mt-1 text-xs font-normal tracking-widest uppercase" style={{ color: C.muted, fontFamily: 'sans-serif' }}>
              Votre bien-être mental, simplifié.
            </p>
            <p className="mt-4 text-sm leading-relaxed" style={{ color: C.darkMid, fontFamily: 'sans-serif' }}>
              Un espace bienveillant et confidentiel pour prendre soin de vous, chaque jour, entre vos séances.
            </p>

            <div
              className="mt-5 w-full space-y-2 rounded-2xl p-4 text-left text-xs"
              style={{ backgroundColor: C.sageLight, fontFamily: 'sans-serif', color: C.darkMid }}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 shrink-0" style={{ color: C.dark }} />
                <span>100% anonyme, confidentiel et sécurisé.</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="size-4 shrink-0" style={{ color: C.dark }} />
                <span>Soutien bienveillant 24h/24.</span>
              </div>
            </div>

            <button
              onClick={() => setStep(1)}
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-semibold transition-all hover:opacity-90"
              style={{ backgroundColor: C.dark, color: C.cream, fontFamily: 'sans-serif' }}
            >
              Commencer votre voyage <ArrowRight className="size-4" />
            </button>
          </div>
        )}

        {/* STEP 1: Nickname & Language */}
        {step === 1 && (
          <div className="flex flex-col">
            <div className="mb-5">
              <h2 className="text-2xl font-bold" style={{ color: C.dark }}>Comment vous appeler ?</h2>
              <p className="mt-1 text-xs" style={{ color: C.muted, fontFamily: 'sans-serif' }}>
                Choisissez un pseudonyme. Votre vrai nom reste secret.
              </p>
            </div>

            <div className="space-y-5" style={{ fontFamily: 'sans-serif' }}>
              <div className="space-y-1.5">
                <Label htmlFor="nickname" className="text-xs font-medium" style={{ color: C.darkMid }}>
                  Votre pseudo
                </Label>
                <div className="relative">
                  <User className="absolute top-3 left-3 size-4" style={{ color: C.muted }} />
                  <Input
                    id="nickname"
                    placeholder="Ex: Yasmine, Amine..."
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="rounded-xl pl-9 border-0 focus-visible:ring-1"
                    style={{ backgroundColor: C.sageLight, color: C.dark }}
                    maxLength={30}
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium" style={{ color: C.darkMid }}>Langue de prédilection</Label>
                <div className="grid grid-cols-2 gap-2">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => setLanguage(lang.code)}
                      className="flex flex-col items-start rounded-2xl border p-3 text-left transition-all"
                      style={{
                        borderColor: language === lang.code ? C.dark : C.sageLight,
                        backgroundColor: language === lang.code ? C.sageLight : C.cream,
                      }}
                    >
                      <span className="text-lg">{lang.flag}</span>
                      <span className="mt-1 text-xs font-semibold" style={{ color: C.dark }}>{lang.label}</span>
                      <span className="text-[10px]" style={{ color: C.muted }}>{lang.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-7 flex items-center gap-3">
              <button
                onClick={() => setStep(0)}
                className="flex items-center gap-1 rounded-xl px-4 py-2.5 text-xs"
                style={{ color: C.muted, fontFamily: 'sans-serif' }}
              >
                <ArrowLeft className="size-3.5" /> Retour
              </button>
              <button
                disabled={!nickname.trim()}
                onClick={() => setStep(2)}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40"
                style={{ backgroundColor: C.dark, color: C.cream, fontFamily: 'sans-serif' }}
              >
                Continuer <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Privacy & Consent */}
        {step === 2 && (
          <div className="flex flex-col">
            <div className="mb-5">
              <div
                className="mb-3 flex size-10 items-center justify-center rounded-2xl"
                style={{ backgroundColor: C.sageLight }}
              >
                <Lock className="size-5" style={{ color: C.dark }} />
              </div>
              <h2 className="text-2xl font-bold" style={{ color: C.dark }}>Confidentialité</h2>
              <p className="mt-1 text-xs" style={{ color: C.muted, fontFamily: 'sans-serif' }}>
                Vous décidez de ce que voit votre spécialiste.
              </p>
            </div>

            <div className="space-y-3" style={{ fontFamily: 'sans-serif' }}>
              {(['summary_only', 'full_chat'] as Consent[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setConsent(option)}
                  className="flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all"
                  style={{
                    borderColor: consent === option ? C.dark : C.sageLight,
                    backgroundColor: consent === option ? C.sageLight : C.cream,
                  }}
                >
                  <div
                    className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border"
                    style={{
                      borderColor: consent === option ? C.dark : C.sageMid,
                      backgroundColor: consent === option ? C.dark : 'transparent',
                    }}
                  >
                    {consent === option && <Check className="size-3" style={{ color: C.cream }} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold" style={{ color: C.dark }}>
                        {option === 'summary_only' ? 'Résumé uniquement' : 'Partage complet'}
                      </p>
                      {option === 'summary_only' && (
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: C.sageMid, color: C.dark }}>
                          Recommandé
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed" style={{ color: C.muted }}>
                      {option === 'summary_only'
                        ? 'Votre spécialiste reçoit une synthèse hebdomadaire. Vos messages détaillés restent secrets.'
                        : "Votre spécialiste peut lire l'intégralité de vos échanges."}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-7 flex items-center gap-3">
              <button onClick={() => setStep(1)} className="flex items-center gap-1 rounded-xl px-4 py-2.5 text-xs" style={{ color: C.muted, fontFamily: 'sans-serif' }}>
                <ArrowLeft className="size-3.5" /> Retour
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold hover:opacity-90"
                style={{ backgroundColor: C.dark, color: C.cream, fontFamily: 'sans-serif' }}
              >
                Continuer <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Emergency Contact */}
        {step === 3 && (
          <div className="flex flex-col">
            <div className="mb-5">
              <div className="mb-3 flex size-10 items-center justify-center rounded-2xl" style={{ backgroundColor: C.sageLight }}>
                <ShieldCheck className="size-5" style={{ color: C.dark }} />
              </div>
              <h2 className="text-2xl font-bold" style={{ color: C.dark }}>Contact de confiance</h2>
              <p className="mt-1 text-xs" style={{ color: C.muted, fontFamily: 'sans-serif' }}>
                Optionnel — contacté seulement en cas d'urgence absolue.
              </p>
            </div>

            <div className="space-y-4" style={{ fontFamily: 'sans-serif' }}>
              <div className="space-y-1.5">
                <Label htmlFor="emergencyName" className="text-xs font-medium" style={{ color: C.darkMid }}>Nom ou lien</Label>
                <Input
                  id="emergencyName"
                  placeholder="Ex: Ma sœur, Mon ami(e)..."
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  className="rounded-xl border-0"
                  style={{ backgroundColor: C.sageLight, color: C.dark }}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="emergencyEmail" className="text-xs font-medium" style={{ color: C.darkMid }}>Email du contact</Label>
                <Input
                  id="emergencyEmail"
                  type="email"
                  placeholder="contact@exemple.com"
                  value={emergencyEmail}
                  onChange={(e) => setEmergencyEmail(e.target.value)}
                  className="rounded-xl border-0"
                  style={{ backgroundColor: C.sageLight, color: C.dark }}
                />
              </div>
              <p className="rounded-2xl p-3 text-xs" style={{ backgroundColor: C.sageLight, color: C.muted }}>
                Vous pourrez modifier ces informations à tout moment dans vos paramètres.
              </p>
            </div>

            <div className="mt-7 flex items-center gap-3">
              <button onClick={() => setStep(2)} className="flex items-center gap-1 rounded-xl px-4 py-2.5 text-xs" style={{ color: C.muted, fontFamily: 'sans-serif' }}>
                <ArrowLeft className="size-3.5" /> Retour
              </button>
              <button
                disabled={busy}
                onClick={() => void handleFinish()}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: C.dark, color: C.cream, fontFamily: 'sans-serif' }}
              >
                {busy ? 'Enregistrement...' : 'Accéder à mon espace'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
