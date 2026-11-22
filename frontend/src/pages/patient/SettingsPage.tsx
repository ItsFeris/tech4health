// Settings (design: 9 · Settings).
import { useEffect, useState } from 'react'
import { LogOut, Phone, Settings } from 'lucide-react'
import { getAppointments, getSpecialist, updateConsent } from '@/api'
import { useAuth } from '@/auth/AuthContext'
import type { Appointment, Consent, Lang, SpecialistCard } from '@/types/contract'
import { Card, Headline, Hero, Notice, Pill, SectionLabel, Skeleton, TopBar } from '@/components/t4h/kit'
import { dayLabel, timeLabel } from '@/lib/format'
import { cn } from '@/lib/utils'
import { SpecialistPhoto, VerifiedBadge, lookOf } from '@/components/t4h/specialist'

const LANGS: { id: Lang; label: string }[] = [
  { id: 'darija', label: 'Tounsi' },
  { id: 'ar', label: 'العربية' },
  { id: 'fr', label: 'Français' },
  { id: 'en', label: 'English' },
]

export default function SettingsPage() {
  const { me, refresh, logout } = useAuth()
  const [consent, setConsent] = useState<Consent>(me?.consent ?? 'summary_only')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [appointments, setAppointments] = useState<Appointment[] | null>(null)
  const [apptError, setApptError] = useState(false)
  const [specialist, setSpecialist] = useState<SpecialistCard | null>(null)

  useEffect(() => {
    if (me?.specialist_id) getSpecialist(me.specialist_id).then(setSpecialist).catch(() => setSpecialist(null))
  }, [me?.specialist_id])

  useEffect(() => {
    getAppointments()
      .then(setAppointments)
      .catch(() => setApptError(true))
  }, [])

  async function toggleConsent() {
    const next: Consent = consent === 'full_chat' ? 'summary_only' : 'full_chat'
    setSaving(true)
    setError(null)
    setConsent(next)
    try {
      await updateConsent(next)
      await refresh()
    } catch {
      setConsent(consent)
      setError("Your choice wasn't saved. Nothing changed, try again.")
    } finally {
      setSaving(false)
    }
  }

  const now = new Date().toISOString()
  const upcoming = (appointments ?? []).filter((a) => a.status === 'scheduled' && a.starts_at >= now).sort((a, b) => a.starts_at.localeCompare(b.starts_at)).slice(0, 2)
  const full = consent === 'full_chat'

  return (
    <div className="relative min-h-svh overflow-hidden">
      <Hero tone="lavender" />
      <div className="relative z-10 flex flex-col gap-3.5 px-5 pb-6 pt-6">
        <TopBar
          center={
            <Pill>
              <Settings className="size-4" /> Settings
            </Pill>
          }
        />
        <Headline eyebrow="Your space" title={me?.nickname ?? ''} className="mb-3 mt-6" />

        <Card>
          <SectionLabel>Language</SectionLabel>
          <div className="mt-3 flex flex-wrap gap-2">
            {LANGS.map((l) => (
              <span key={l.id} lang={l.id === 'ar' ? 'ar' : undefined} className={cn('flex h-10 items-center rounded-full px-4 text-[14px]', me?.language === l.id ? 'bg-ink text-white' : 'bg-soft text-faint')}>
                {l.label}
              </span>
            ))}
          </div>
          <p className="mt-2.5 text-[12.5px] text-sub">Nour talks to you in this language. To change it, ask your specialist.</p>
        </Card>

        <Card>
          <SectionLabel>Privacy</SectionLabel>
          <div className="mt-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-[16px]">Let my specialist read my full chat</p>
              <p className="text-[13px] text-sub">{full ? 'On · they can read your chat with Nour' : 'Off · they only see summaries'}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={full}
              aria-label="Let my specialist read my full chat"
              disabled={saving}
              onClick={() => void toggleConsent()}
              className={cn('relative h-8 w-[52px] shrink-0 rounded-full transition', full ? 'bg-ink' : 'bg-line')}
            >
              <span className={cn('absolute top-1 size-6 rounded-full bg-white shadow transition-all', full ? 'left-[24px]' : 'left-1')} />
            </button>
          </div>
          <Notice className="mt-4 py-3 text-[13px]" icon={<span />}>
            Messages that suggest you may be in danger are always shared, whatever you choose here.
          </Notice>
          {error && (
            <Notice tone="error" className="mt-3">
              {error}
            </Notice>
          )}
        </Card>

        <Card>
          <SectionLabel>My specialist</SectionLabel>
          {specialist && (
            <div className="mt-3 flex items-center gap-3.5">
              <SpecialistPhoto id={specialist.id} photoUrl={specialist.photo_url} name={specialist.nickname} size={56} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[17px] leading-tight">{specialist.nickname}</p>
                <p className="text-[13.5px]" style={{ color: lookOf(specialist.id).col }}>
                  {specialist.specialty ?? 'Specialist'}
                </p>
                <p className="mt-1 flex items-center gap-2 text-[12.5px] text-sub">
                  {specialist.price != null ? `${specialist.price} DT per session` : 'Your specialist'}
                  {specialist.verified && <VerifiedBadge className="h-6 px-2 text-[11px]" />}
                </p>
              </div>
            </div>
          )}
          <p className="mt-4 text-[12.5px] text-sub">Upcoming sessions</p>
          {appointments === null && !apptError ? (
            <Skeleton className="mt-2 h-28 rounded-[22px]" />
          ) : apptError ? (
            <p className="mt-3 text-[14px] text-sos">Could not load your sessions.</p>
          ) : upcoming.length === 0 ? (
            <p className="mt-3 text-[14px] text-sub">No session booked yet.</p>
          ) : (
            <div className="mt-2 grid grid-cols-2 gap-2.5">
              {upcoming.map((a, i) => (
                <div key={a.id} className="rounded-[22px] p-3.5" style={{ background: i === 0 ? 'linear-gradient(140deg, #CBECF5 0%, #D9F0EA 100%)' : 'linear-gradient(140deg, #DDD8FF 0%, #ECE4F8 100%)' }}>
                  <p className="text-[16px] leading-tight">{dayLabel(a.starts_at)}</p>
                  <p className={cn('text-[16px] leading-tight', i === 0 ? 'text-teal-ink' : 'text-lav-ink')}>{a.type === 'urgent' ? 'earlier slot' : 'weekly'}</p>
                  <p className="mt-3 text-[30px] leading-none tracking-[-1px]">{timeLabel(a.starts_at)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="flex items-center gap-3.5 py-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-soft">
            <Phone className="size-[18px]" fill="currentColor" />
          </span>
          <div className="min-w-0">
            <SectionLabel>Emergency contact</SectionLabel>
            <p className="truncate text-[16px]">{me?.emergency_name || 'Not added yet'}</p>
          </div>
        </Card>

        <button type="button" onClick={() => void logout()} className="flex h-[52px] items-center justify-center gap-2 rounded-full border border-line bg-white text-[15px] text-sos">
          <LogOut className="size-4" /> Log out
        </button>
      </div>
    </div>
  )
}
