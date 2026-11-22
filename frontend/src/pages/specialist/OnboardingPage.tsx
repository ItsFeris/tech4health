// Specialist onboarding (design: 10 · Specialist onboarding).
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Loader2, LogOut } from 'lucide-react'
import { onboardSpecialist } from '@/api'
import { useAuth } from '@/auth/AuthContext'
import type { Lang } from '@/types/contract'
import { FlatField, Hero, LogoGlyph, Notice } from '@/components/t4h/kit'
import { initials } from '@/lib/format'
import { cn } from '@/lib/utils'

const LANGS: { id: Lang; label: string }[] = [
  { id: 'darija', label: 'Tounsi' },
  { id: 'ar', label: 'العربية' },
  { id: 'fr', label: 'Français' },
  { id: 'en', label: 'English' },
]
const SPECIALTIES = ['Clinical psychologist', 'Psychiatrist', 'Psychotherapist', 'Counsellor']

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { refresh, logout } = useAuth()
  const [name, setName] = useState('')
  const [language, setLanguage] = useState<Lang>('fr')
  const [specialty, setSpecialty] = useState(SPECIALTIES[0])
  const [bio, setBio] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    setError(null)
    try {
      await onboardSpecialist({ nickname: name.trim(), language, specialty, bio: bio.trim() || null })
      await refresh()
      navigate('/specialist', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your profile.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative min-h-svh">
      <Hero tone="lavender" variant="wide" height={520} />
      <div className="relative z-10 mx-auto max-w-[1216px] px-6 pb-16 pt-6">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-3">
            <span className="flex size-[46px] items-center justify-center rounded-full bg-white/70 shadow-[var(--shadow-soft)]">
              <LogoGlyph className="size-5" />
            </span>
            <span className="text-[19px] tracking-[-0.3px]">Tech4Health</span>
          </span>
          <button type="button" onClick={() => void logout()} className="flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm shadow-[var(--shadow-soft)]">
            <LogOut className="size-4" /> Log out
          </button>
        </div>
        <div className="pt-6 text-center">
          <p className="text-[16px] text-ink-2">Welcome, specialist · about 2 minutes</p>
          <h1 className="headline mt-1 text-[56px]">Set up your profile</h1>
        </div>

        <div className="mt-10 grid items-start gap-6 lg:grid-cols-[1fr_340px]">
          <form onSubmit={submit} className="rounded-[28px] bg-white p-7 shadow-[var(--shadow-card)]">
            <label htmlFor="sname" className="text-[13px] text-sub">
              Display name (patients see this)
            </label>
            <FlatField id="sname" className="mt-1.5 h-12" required maxLength={60} placeholder="e.g. Dr. Amira Ben Salah" value={name} onChange={(e) => setName(e.target.value)} />

            <p className="mt-5 text-[13px] text-sub">Main language you work in</p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {LANGS.map((l) => (
                <Chip key={l.id} on={language === l.id} onClick={() => setLanguage(l.id)}>
                  <span lang={l.id === 'ar' ? 'ar' : undefined}>{l.label}</span>
                </Chip>
              ))}
            </div>

            <p className="mt-5 text-[13px] text-sub">Specialty</p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {SPECIALTIES.map((s) => (
                <Chip key={s} on={specialty === s} onClick={() => setSpecialty(s)}>
                  {s}
                </Chip>
              ))}
            </div>

            <label htmlFor="sbio" className="mt-5 block text-[13px] text-sub">
              Short bio
            </label>
            <textarea
              id="sbio"
              rows={3}
              maxLength={200}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="I help young adults with anxiety, stress and sleep. I listen first, and we go at your pace."
              className="mt-1.5 w-full resize-none rounded-xl bg-soft px-3.5 py-3 text-sm outline-none focus:ring-2 focus:ring-ink"
            />
            <p className="text-right text-[12px] text-faint">{bio.length} / 200</p>

            {error && (
              <Notice tone="error" className="mt-3">
                {error}
              </Notice>
            )}
            <div className="mt-4 flex justify-end">
              <button type="submit" disabled={busy || !name.trim()} className="flex h-12 items-center gap-4 rounded-full bg-ink pl-5 pr-1.5 text-[15px] text-white disabled:opacity-50">
                Continue to my patients
                <span className="flex size-9 items-center justify-center rounded-full bg-white text-ink">{busy ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}</span>
              </button>
            </div>
          </form>

          <div>
            <p className="mb-2 text-[13px] text-sub">How patients see you</p>
            <div className="relative overflow-hidden rounded-[28px] p-6 shadow-[var(--shadow-card)]" style={{ background: 'linear-gradient(140deg, #DDD8FF 0%, #F3DCEB 100%)' }}>
              <span className="flex size-14 items-center justify-center rounded-full bg-white text-[17px]">{initials(name || 'S T')}</span>
              <p className="mt-4 text-[24px] leading-tight tracking-[-0.5px]">{name || 'Your name'}</p>
              <p className="text-[24px] leading-tight tracking-[-0.5px] text-lav-ink">{specialty}</p>
              <p className="mt-3 text-[14px] text-ink-2">{bio || 'Your short bio appears here.'}</p>
              <span className="mt-4 inline-flex h-8 items-center rounded-full bg-white/80 px-3 text-[12.5px]">{LANGS.find((l) => l.id === language)?.label}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className={cn('h-10 rounded-full px-4 text-[14px] transition', on ? 'bg-ink text-white' : 'bg-soft text-ink hover:bg-soft-2')}>
      {children}
    </button>
  )
}
