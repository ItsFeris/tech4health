import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Heart, Lock, ShieldCheck, Sparkles, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { onboardPatient } from '@/api'
import { useAuth } from '@/auth/AuthContext'
import type { Consent, Lang } from '@/types/contract'
import { cn } from '@/lib/utils'

const languages: { code: Lang; label: string; flag: string; desc: string }[] = [
  { code: 'darija', label: 'Tounsi / Darija', flag: '🇹🇳', desc: 'B tounsi kima tehki dima' },
  { code: 'fr', label: 'Français', flag: '🇫🇷', desc: 'Échangez en français' },
  { code: 'ar', label: 'العربية', flag: '🌙', desc: 'باللغة العربية الفصحى' },
  { code: 'en', label: 'English', flag: '🇬🇧', desc: 'Communicate in English' },
]

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { refresh } = useAuth()

  // Steps: 0: Welcome, 1: Identity & Language, 2: Privacy & Consent, 3: Emergency contact
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
    <div className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-b from-primary/5 via-background to-background p-4">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border bg-card/90 p-6 shadow-xl backdrop-blur-md transition-all">
        {/* Progress Dots */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  step === i ? 'w-6 bg-primary' : i < step ? 'w-2 bg-primary/40' : 'w-2 bg-muted'
                )}
              />
            ))}
          </div>
          <span className="text-muted-foreground text-xs font-medium">Étape {step + 1} / 4</span>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive mb-4 rounded-xl p-3 text-sm">
            {error}
          </div>
        )}

        {/* STEP 0: Welcome Screen */}
        {step === 0 && (
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-6 flex size-28 items-center justify-center rounded-full bg-gradient-to-tr from-primary/20 via-primary/10 to-transparent">
              <div className="flex size-20 items-center justify-center rounded-full bg-primary/20 text-primary shadow-inner">
                <Sparkles className="size-10 animate-pulse" />
              </div>
              <div className="absolute -top-1 -right-1 flex size-8 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-sm">
                <Heart className="size-4 text-primary fill-primary" />
              </div>
            </div>

            <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground">
              Trouvez votre calme intérieur
            </h1>
            <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
              Prenez une profonde inspiration. Tech4Health est votre espace bienveillant pour vous
              accompagner entre vos séances avec votre spécialiste.
            </p>

            <div className="mt-6 w-full space-y-2 rounded-2xl bg-muted/40 p-4 text-left text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary shrink-0" />
                <span>100% anonyme, confidentiel et sécurisé.</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="size-4 text-primary shrink-0" />
                <span>Un soutien bienveillant 24h/24 en toute sérénité.</span>
              </div>
            </div>

            <Button
              size="lg"
              className="mt-8 w-full rounded-2xl text-base shadow-lg shadow-primary/20"
              onClick={() => setStep(1)}
            >
              Commencer <ArrowRight className="ml-2 size-4" />
            </Button>
          </div>
        )}

        {/* STEP 1: Nickname & Language */}
        {step === 1 && (
          <div className="flex flex-col">
            <div className="mb-4">
              <h2 className="font-serif text-2xl font-semibold text-foreground">Comment vous appeler ?</h2>
              <p className="text-muted-foreground mt-1 text-xs">
                Choisissez un pseudonyme. Votre vrai nom ne sera jamais affiché.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="nickname" className="text-xs font-medium">Votre pseudo</Label>
                <div className="relative">
                  <User className="text-muted-foreground absolute top-3 left-3 size-4" />
                  <Input
                    id="nickname"
                    placeholder="Ex: Yasmine, Amine, Billie..."
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="rounded-xl pl-9"
                    maxLength={30}
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Label className="text-xs font-medium">Langue de prédilection</Label>
                <div className="grid grid-cols-2 gap-2">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => setLanguage(lang.code)}
                      className={cn(
                        'flex flex-col items-start rounded-2xl border p-3 text-left transition-all',
                        language === lang.code
                          ? 'border-primary bg-primary/10 shadow-sm'
                          : 'border-border/60 bg-card/60 hover:border-primary/40'
                      )}
                    >
                      <span className="text-lg">{lang.flag}</span>
                      <span className="mt-1 font-medium text-xs text-foreground">{lang.label}</span>
                      <span className="text-muted-foreground text-[10px]">{lang.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-3">
              <Button variant="ghost" className="rounded-xl" onClick={() => setStep(0)}>
                <ArrowLeft className="mr-1 size-4" /> Retour
              </Button>
              <Button
                className="flex-1 rounded-xl"
                disabled={!nickname.trim()}
                onClick={() => setStep(2)}
              >
                Continuer <ArrowRight className="ml-1 size-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Privacy & Consent */}
        {step === 2 && (
          <div className="flex flex-col">
            <div className="mb-4">
              <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Lock className="size-5" />
              </div>
              <h2 className="font-serif text-2xl font-semibold text-foreground">Confidentialité & Partage</h2>
              <p className="text-muted-foreground mt-1 text-xs">
                Vous décidez de ce qui est partagé avec votre spécialiste.
              </p>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setConsent('summary_only')}
                className={cn(
                  'flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all',
                  consent === 'summary_only'
                    ? 'border-primary bg-primary/10 ring-1 ring-primary'
                    : 'border-border/60 bg-card hover:border-primary/40'
                )}
              >
                <div className={cn(
                  'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border',
                  consent === 'summary_only' ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'
                )}>
                  {consent === 'summary_only' && <Check className="size-3" />}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-medium text-sm text-foreground">Résumé uniquement</p>
                    <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">Recommandé</span>
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                    Votre spécialiste reçoit une synthèse hebdomadaire des thèmes clés. Vos messages détaillés restent secrets.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setConsent('full_chat')}
                className={cn(
                  'flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all',
                  consent === 'full_chat'
                    ? 'border-primary bg-primary/10 ring-1 ring-primary'
                    : 'border-border/60 bg-card hover:border-primary/40'
                )}
              >
                <div className={cn(
                  'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border',
                  consent === 'full_chat' ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'
                )}>
                  {consent === 'full_chat' && <Check className="size-3" />}
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground">Partage complet</p>
                  <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                    Votre spécialiste peut lire l'intégralité de vos échanges pour un suivi approfondi.
                  </p>
                </div>
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-amber-200/60 bg-amber-50/60 p-3 text-[11px] text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
              <span className="font-semibold">Notice de sécurité : </span>
              En cas de détresse aiguë ou d'urgence détectée, un extrait d'alerte sera transmis à votre spécialiste pour assurer votre protection.
            </div>

            <div className="mt-8 flex items-center gap-3">
              <Button variant="ghost" className="rounded-xl" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-1 size-4" /> Retour
              </Button>
              <Button className="flex-1 rounded-xl" onClick={() => setStep(3)}>
                Continuer <ArrowRight className="ml-1 size-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Emergency Contact (Optional) */}
        {step === 3 && (
          <div className="flex flex-col">
            <div className="mb-4">
              <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="size-5" />
              </div>
              <h2 className="font-serif text-2xl font-semibold text-foreground">Contact de confiance</h2>
              <p className="text-muted-foreground mt-1 text-xs">
                Optionnel : Une personne proche à contacter uniquement en cas d'urgence absolue.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="emergencyName" className="text-xs font-medium">Nom ou lien</Label>
                <Input
                  id="emergencyName"
                  placeholder="Ex: Ma sœur, Mon ami(e)..."
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="emergencyEmail" className="text-xs font-medium">Email du contact</Label>
                <Input
                  id="emergencyEmail"
                  type="email"
                  placeholder="contact@exemple.com"
                  value={emergencyEmail}
                  onChange={(e) => setEmergencyEmail(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="rounded-2xl bg-muted/40 p-4 text-xs text-muted-foreground">
                <p>
                  Vous pourrez modifier ces informations à tout moment dans vos paramètres.
                </p>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-3">
              <Button variant="ghost" className="rounded-xl" onClick={() => setStep(2)}>
                <ArrowLeft className="mr-1 size-4" /> Retour
              </Button>
              <Button
                className="flex-1 rounded-xl shadow-lg shadow-primary/20"
                disabled={busy}
                onClick={() => void handleFinish()}
              >
                {busy ? 'Enregistrement...' : 'Accéder à mon espace'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
