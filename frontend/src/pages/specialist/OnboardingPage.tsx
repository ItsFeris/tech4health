// Specialist onboarding (design M01 profile, M02 photo & price). Then /specialist/verify (M03–M09). Dhia owns this file.
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera, Minus, Plus } from 'lucide-react'
import { onboardSpecialist } from '@/api'
import { useAuth } from '@/auth/AuthContext'
import type { Lang } from '@/types/contract'
import { Cta, Field, FieldLabel, GlassCircle, Headline, Hero, Notice, Pill, TextArea } from '@/components/t4h/kit'
import { Portrait, lookOf } from '@/components/t4h/specialist'
import { cn } from '@/lib/utils'

const LANGS: { id: Lang; label: string }[] = [
  { id: 'darija', label: 'Tounsi' },
  { id: 'fr', label: 'Français' },
  { id: 'ar', label: 'العربية' },
  { id: 'en', label: 'English' },
]
const SPECIALTIES = ['Clinical psychologist', 'Psychiatrist', 'Psychotherapist', 'Counselor']

/** Square, small JPEG so it fits in the database as a data: URL. */
async function photoToDataUrl(file: File, size = 320): Promise<string> {
  const img = await createImageBitmap(file)
  const side = Math.min(img.width, img.height)
  const c = document.createElement('canvas')
  c.width = c.height = size
  c.getContext('2d')!.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size)
  return c.toDataURL('image/jpeg', 0.82)
}

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { me, refresh, logout } = useAuth()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [specialty, setSpecialty] = useState(SPECIALTIES[0])
  const [languages, setLanguages] = useState<Lang[]>(['darija', 'fr'])
  const [photo, setPhoto] = useState<string | null>(null)
  const [price, setPrice] = useState(60)
  const [years, setYears] = useState(5)
  const [bio, setBio] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const canContinue = step === 0 ? name.trim().length > 1 && languages.length > 0 : true

  function toggleLang(l: Lang) {
    setLanguages((cur) => (cur.includes(l) ? cur.filter((x) => x !== l) : [...cur, l]))
  }

  async function onPhoto(file?: File) {
    if (!file) return
    try {
      setPhoto(await photoToDataUrl(file))
    } catch {
      setError('Could not read this photo. Try another one.')
    }
  }

  async function submit() {
    setBusy(true)
    setError(null)
    try {
      await onboardSpecialist({ nickname: name.trim(), language: languages[0], languages, specialty, bio: bio.trim() || null, price, years, photo_url: photo })
      await refresh()
      navigate('/specialist/verify', { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your profile.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-svh bg-[#EDEBF2]">
      <div className="relative mx-auto flex min-h-svh max-w-[430px] flex-col overflow-hidden bg-background">
        <Hero tone={step === 0 ? 'lavender' : 'teal'} variant="petals" />
        <div className="relative z-10 flex flex-1 flex-col px-5 pb-7 pt-6">
          <div className="flex items-center justify-between">
            <GlassCircle aria-label={step === 0 ? 'Log out' : 'Back'} onClick={() => (step === 0 ? void logout() : setStep(0))}>
              <ArrowLeft className="size-5" />
            </GlassCircle>
            <Pill>Step {step + 1} of 4 · {step === 0 ? 'Profile' : 'Photo & price'}</Pill>
            <span className="w-[52px]" />
          </div>
          <div className="mt-5 grid grid-cols-4 gap-1.5" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={cn('h-1 rounded-full', i <= step ? 'bg-ink' : 'bg-white/80')} />
            ))}
          </div>

          {step === 0 ? (
            <section className="mt-12 flex flex-col gap-3">
              <Headline eyebrow="Welcome to Tech4Health" title="Tell patients about you" />
              <div className="mt-5">
                <FieldLabel htmlFor="sname">Full name, as on your ID</FieldLabel>
                <Field id="sname" autoFocus maxLength={60} placeholder="e.g. Dr. Salma Trabelsi" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <p className="mt-2 text-[13px] text-sub">Specialty</p>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Specialty">
                {SPECIALTIES.map((s) => (
                  <Chip key={s} on={specialty === s} onClick={() => setSpecialty(s)} role="radio">
                    {s}
                  </Chip>
                ))}
              </div>
              <p className="mt-2 text-[13px] text-sub">Languages you work in</p>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Languages">
                {LANGS.map((l) => (
                  <Chip key={l.id} on={languages.includes(l.id)} onClick={() => toggleLang(l.id)}>
                    <span lang={l.id === 'ar' ? 'ar' : undefined}>{l.label}</span>
                  </Chip>
                ))}
              </div>
            </section>
          ) : (
            <section className="mt-10 flex flex-col gap-3">
              <Headline eyebrow="What patients see first" title="Your photo & price" />
              <div className="mt-3 flex flex-col items-center gap-2">
                <button type="button" onClick={() => fileRef.current?.click()} aria-label="Add a photo" className="relative">
                  <span className="flex size-[124px] items-end justify-center overflow-hidden rounded-full border-[5px] border-white shadow-[var(--shadow-card)]" style={{ background: lookOf(me?.id ?? name).bg }}>
                    {photo ? <img src={photo} alt="Your photo" className="size-full object-cover" /> : <Portrait id={me?.id ?? name} size={124} />}
                  </span>
                  <span className="absolute bottom-1 right-1 flex size-10 items-center justify-center rounded-full border-[3px] border-white bg-ink text-white">
                    <Camera className="size-4" />
                  </span>
                </button>
                <input ref={fileRef} type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => void onPhoto(e.target.files?.[0])} />
                <p className="text-[13px] text-ink-2">A clear, friendly photo of your face.</p>
              </div>

              <div className="rounded-[26px] bg-white p-5 shadow-[var(--shadow-soft)]">
                <p className="text-[12px] tracking-[0.08em] text-sub uppercase">Price per 50-min session</p>
                <div className="mt-2 flex items-center justify-between">
                  <Stepper label="Lower price" onClick={() => setPrice(Math.max(0, price - 5))} icon={<Minus className="size-5" />} />
                  <p aria-live="polite">
                    <span className="text-[52px] font-light leading-none tracking-[-2px]">{price}</span> <span className="text-[15px]">DT</span>
                  </p>
                  <Stepper dark label="Higher price" onClick={() => setPrice(Math.min(1000, price + 5))} icon={<Plus className="size-5" />} />
                </div>
                <p className="mt-2 text-center text-[13px] text-sub">Shown to patients when they choose a specialist.</p>
                <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
                  <span className="text-[14px]">Years of practice</span>
                  <span className="flex items-center gap-3">
                    <Stepper small label="Fewer years" onClick={() => setYears(Math.max(0, years - 1))} icon={<Minus className="size-4" />} />
                    <span className="w-6 text-center text-[18px]">{years}</span>
                    <Stepper small label="More years" onClick={() => setYears(Math.min(60, years + 1))} icon={<Plus className="size-4" />} />
                  </span>
                </div>
              </div>

              <div>
                <FieldLabel htmlFor="sbio">Short bio</FieldLabel>
                <TextArea id="sbio" rows={3} maxLength={200} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="I help young adults with anxiety, stress and sleep. We go at your pace." />
              </div>
            </section>
          )}

          <div className="mt-auto flex flex-col gap-3 pt-8">
            {error && <Notice tone="error">{error}</Notice>}
            <Cta onClick={() => (step === 0 ? setStep(1) : void submit())} disabled={!canContinue} loading={busy}>
              Continue
            </Cta>
          </div>
        </div>
      </div>
    </div>
  )
}

function Chip({ on, onClick, children, role }: { on: boolean; onClick: () => void; children: React.ReactNode; role?: string }) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={role ? on : undefined}
      aria-pressed={role ? undefined : on}
      onClick={onClick}
      className={cn('h-11 rounded-full px-4 text-[14.5px] transition', on ? 'bg-ink text-white' : 'bg-white text-ink shadow-[0_6px_16px_rgba(40,30,70,.07)]')}
    >
      {children}
    </button>
  )
}

function Stepper({ label, onClick, icon, dark, small }: { label: string; onClick: () => void; icon: React.ReactNode; dark?: boolean; small?: boolean }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className={cn('flex items-center justify-center rounded-full', small ? 'size-9' : 'size-[52px]', dark ? 'bg-ink text-white' : 'bg-soft text-ink')}>
      {icon}
    </button>
  )
}
