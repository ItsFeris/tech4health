import { useEffect, useState } from 'react'
import { Calendar, Check, Globe, Lock, LogOut, ShieldCheck, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getAppointments, updateConsent } from '@/api'
import { useAuth } from '@/auth/AuthContext'
import type { Appointment, Consent } from '@/types/contract'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
  const { me, refresh, logout } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [consent, setConsent] = useState<Consent>(me?.consent ?? 'summary_only')
  const [savingConsent, setSavingConsent] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const data = await getAppointments()
        setAppointments(data)
      } catch {
        // Ignore
      }
    }
    load()
  }, [])

  async function handleConsentChange(nextConsent: Consent) {
    if (nextConsent === consent || savingConsent) return
    setSavingConsent(true)
    setSuccessMsg(null)
    try {
      await updateConsent(nextConsent)
      setConsent(nextConsent)
      await refresh()
      setSuccessMsg('Vos préférences de partage ont été mises à jour.')
      setTimeout(() => setSuccessMsg(null), 3500)
    } catch {
      // Ignore
    } finally {
      setSavingConsent(false)
    }
  }

  const langNames = {
    darija: 'Tounsi / Darija 🇹🇳',
    fr: 'Français 🇫🇷',
    ar: 'العربية 🌙',
    en: 'English 🇬🇧',
  }

  return (
    <div className="flex flex-col gap-5 p-4">
      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-5">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
          Paramètres & Confidentialité
        </h1>
        <p className="text-muted-foreground mt-1 text-xs">
          Gérez votre profil, vos préférences de langue et le partage avec votre médecin.
        </p>
      </div>

      {successMsg && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
          {successMsg}
        </div>
      )}

      {/* Profile Card */}
      <Card className="rounded-3xl border-border/70 bg-card/80 shadow-xs">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <User className="size-6" />
            </div>
            <div>
              <p className="font-semibold text-base text-foreground">{me?.nickname ?? 'Patient'}</p>
              <p className="text-muted-foreground text-xs">Compte Patient Sécurisé</p>
            </div>
          </div>

          <div className="flex items-center justify-between border-t pt-3 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Globe className="size-4 text-primary" />
              <span>Langue actuelle</span>
            </div>
            <span className="font-medium text-foreground">
              {me?.language ? langNames[me.language] : 'Tounsi 🇹🇳'}
            </span>
          </div>

          {me?.emergency_name && (
            <div className="flex items-center justify-between border-t pt-3 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <ShieldCheck className="size-4 text-primary" />
                <span>Contact de confiance</span>
              </div>
              <span className="font-medium text-foreground">{me.emergency_name}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Consent / Privacy settings */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <Lock className="size-4 text-primary" />
          <span>Partage avec votre spécialiste</span>
        </div>

        <div className="space-y-2.5">
          <button
            type="button"
            disabled={savingConsent}
            onClick={() => void handleConsentChange('summary_only')}
            className={cn(
              'flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all',
              consent === 'summary_only'
                ? 'border-primary bg-primary/10 ring-1 ring-primary'
                : 'border-border/60 bg-card hover:border-primary/40'
            )}
          >
            <div
              className={cn(
                'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border',
                consent === 'summary_only'
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-muted-foreground'
              )}
            >
              {consent === 'summary_only' && <Check className="size-3" />}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="font-medium text-sm text-foreground">Résumé uniquement</p>
                <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  Recommandé
                </span>
              </div>
              <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                Votre médecin ne lit que la synthèse hebdomadaire rédigée par l'IA. Vos conversations détaillées restent strictement privées.
              </p>
            </div>
          </button>

          <button
            type="button"
            disabled={savingConsent}
            onClick={() => void handleConsentChange('full_chat')}
            className={cn(
              'flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all',
              consent === 'full_chat'
                ? 'border-primary bg-primary/10 ring-1 ring-primary'
                : 'border-border/60 bg-card hover:border-primary/40'
            )}
          >
            <div
              className={cn(
                'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border',
                consent === 'full_chat'
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-muted-foreground'
              )}
            >
              {consent === 'full_chat' && <Check className="size-3" />}
            </div>
            <div>
              <p className="font-medium text-sm text-foreground">Accès complet au chat</p>
              <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                Votre spécialiste peut consulter l'ensemble des échanges pour une analyse approfondie.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Appointments List */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <Calendar className="size-4 text-primary" />
          <span>Vos consultations</span>
        </div>

        {appointments.length === 0 ? (
          <p className="text-muted-foreground rounded-2xl border border-dashed p-4 text-center text-xs">
            Aucun rendez-vous planifié pour le moment.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {appointments.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-2xl border bg-card p-3 text-xs">
                <div>
                  <p className="font-medium text-foreground">Consultation {a.type === 'urgent' ? 'Prioritaire' : 'Hebdomadaire'}</p>
                  <p className="text-muted-foreground text-[11px]">
                    {new Date(a.starts_at).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-[10px] font-semibold',
                    a.status === 'scheduled' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                  )}
                >
                  {a.status === 'scheduled' ? 'Confirmé' : a.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Logout */}
      <Button
        variant="outline"
        size="lg"
        onClick={() => void logout()}
        className="mt-2 w-full rounded-2xl text-destructive hover:bg-destructive/10"
      >
        <LogOut className="mr-2 size-4" /> Se déconnecter
      </Button>
    </div>
  )
}
