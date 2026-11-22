import { useEffect, useState } from 'react'
import { Calendar, Check, Globe, LogOut, ShieldCheck, User } from 'lucide-react'
import { getAppointments, updateConsent } from '@/api'
import { useAuth } from '@/auth/AuthContext'
import type { Appointment, Consent } from '@/types/contract'


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
      } catch { /* ignore */ }
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
    } catch { /* ignore */ }
    finally { setSavingConsent(false) }
  }

  const langNames = {
    darija: 'Tounsi / Darija 🇹🇳',
    fr: 'Français 🇫🇷',
    ar: 'العربية 🌙',
    en: 'English 🇬🇧',
  }

  return (
    <div
      className="flex flex-col px-5 pt-5 pb-10 gap-5"
      style={{ backgroundColor: C.bg, minHeight: '100%', fontFamily: 'sans-serif' }}
    >
      {/* Header */}
      <div
        className="relative overflow-hidden rounded-3xl p-5"
        style={{ backgroundColor: C.dark }}
      >
        <svg viewBox="0 0 320 90" className="absolute inset-0 size-full opacity-15">
          <ellipse cx="80" cy="90" rx="130" ry="70" fill={C.sageMid} />
          <ellipse cx="260" cy="90" rx="120" ry="60" fill={C.sage} />
          <circle cx="250" cy="30" r="28" fill={C.sageLight} />
        </svg>
        <div className="relative">
          <h1 className="text-2xl font-bold" style={{ color: C.cream, fontFamily: 'Georgia, serif' }}>
            Paramètres & Confidentialité
          </h1>
          <p className="mt-1 text-xs" style={{ color: C.sageMid }}>
            Profil, langue et partage avec votre médecin.
          </p>
        </div>
      </div>

      {successMsg && (
        <div
          className="rounded-2xl border p-3 text-xs"
          style={{ borderColor: C.sageMid, backgroundColor: C.sageLight, color: C.darkMid }}
        >
          {successMsg}
        </div>
      )}

      {/* Profile card */}
      <div
        className="rounded-3xl border p-5"
        style={{ borderColor: C.sageLight, backgroundColor: C.cream }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="flex size-12 items-center justify-center rounded-2xl"
            style={{ backgroundColor: C.sageLight }}
          >
            <User className="size-6" style={{ color: C.dark }} />
          </div>
          <div>
            <p className="font-bold text-base" style={{ color: C.dark, fontFamily: 'Georgia, serif' }}>
              {me?.nickname ?? 'Patient'}
            </p>
            <p className="text-xs" style={{ color: C.muted }}>Compte Patient Sécurisé</p>
          </div>
        </div>

        <div
          className="flex items-center justify-between border-t pt-3 text-xs"
          style={{ borderColor: C.sageLight }}
        >
          <div className="flex items-center gap-2" style={{ color: C.muted }}>
            <Globe className="size-4" style={{ color: C.dark }} />
            <span>Langue actuelle</span>
          </div>
          <span className="font-semibold" style={{ color: C.dark }}>
            {me?.language ? langNames[me.language] : 'Tounsi 🇹🇳'}
          </span>
        </div>

        {me?.emergency_name && (
          <div
            className="flex items-center justify-between border-t pt-3 mt-2 text-xs"
            style={{ borderColor: C.sageLight }}
          >
            <div className="flex items-center gap-2" style={{ color: C.muted }}>
              <ShieldCheck className="size-4" style={{ color: C.dark }} />
              <span>Contact de confiance</span>
            </div>
            <span className="font-semibold" style={{ color: C.dark }}>{me.emergency_name}</span>
          </div>
        )}
      </div>

      {/* Consent section */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs font-bold" style={{ color: C.dark }}>Partage avec votre spécialiste</span>
        </div>

        <div className="space-y-2.5">
          {(['summary_only', 'full_chat'] as Consent[]).map((option) => (
            <button
              key={option}
              type="button"
              disabled={savingConsent}
              onClick={() => void handleConsentChange(option)}
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
                    {option === 'summary_only' ? 'Résumé uniquement' : 'Accès complet au chat'}
                  </p>
                  {option === 'summary_only' && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{ backgroundColor: C.sageMid, color: C.dark }}
                    >
                      Recommandé
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: C.muted }}>
                  {option === 'summary_only'
                    ? 'Votre médecin ne lit que la synthèse hebdomadaire. Vos conversations restent privées.'
                    : "Votre spécialiste peut consulter l'ensemble des échanges pour une analyse approfondie."}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Appointments */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Calendar className="size-4" style={{ color: C.dark }} />
          <span className="text-xs font-bold" style={{ color: C.dark }}>Vos consultations</span>
        </div>

        {appointments.length === 0 ? (
          <p
            className="rounded-2xl border-2 border-dashed p-4 text-center text-xs"
            style={{ borderColor: C.sageMid, color: C.muted }}
          >
            Aucun rendez-vous planifié pour le moment.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {appointments.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-2xl border p-3 text-xs"
                style={{ borderColor: C.sageLight, backgroundColor: C.cream }}
              >
                <div>
                  <p className="font-semibold" style={{ color: C.dark }}>
                    Consultation {a.type === 'urgent' ? 'Prioritaire' : 'Hebdomadaire'}
                  </p>
                  <p className="text-[11px]" style={{ color: C.muted }}>
                    {new Date(a.starts_at).toLocaleDateString('fr-FR', {
                      weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
                <span
                  className="rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                  style={
                    a.status === 'scheduled'
                      ? { backgroundColor: C.sageLight, color: C.dark }
                      : { backgroundColor: `${C.sageLight}80`, color: C.muted }
                  }
                >
                  {a.status === 'scheduled' ? 'Confirmé' : a.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Logout */}
      <button
        onClick={() => void logout()}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border py-4 text-sm font-semibold transition-all hover:opacity-80"
        style={{ borderColor: '#D4A0A0', color: '#8B4A4A', backgroundColor: '#FDF5F5' }}
      >
        <LogOut className="size-4" /> Se déconnecter
      </button>
    </div>
  )
}
