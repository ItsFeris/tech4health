// Patient onboarding, 5 steps (design: 2a name, 2b language, D00 choose your specialist, 2d privacy, 2e emergency contact).
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Lock, ShieldAlert } from 'lucide-react'
import { onboardPatient } from '@/api'
import { useAuth } from '@/auth/AuthContext'
import type { Consent, Lang, SpecialistCard } from '@/types/contract'
import { ChoiceRow, Cta, Field, FieldLabel, GlassCircle, GradientChoice, Headline, Hero, Notice, Pill, type Tone } from '@/components/t4h/kit'
import { cn } from '@/lib/utils'
import { shortName } from '@/components/t4h/specialist'
import { SpecialistPicker } from '@/components/t4h/SpecialistPicker'

const LANGS: { id: Lang; label: string; sub: string; arabic?: boolean }[] = [
  { id: 'darija', label: 'Tounsi', sub: 'Derja, written in Latin letters' },
  { id: 'ar', label: 'العربية', sub: 'Arabic, right to left', arabic: true },
  { id: 'fr', label: 'Français', sub: 'French' },
  { id: 'en', label: 'English', sub: 'English' },
]

const CONSENTS: { id: Consent; a: string; b: string; body: string; gradient: string; color: string }[] = [
  {
    id: 'summary_only',
    a: 'My specialist sees',
    b: 'summaries only',
    body: 'Weekly summaries, moods and check-ups. Your chat with Nour stays private.',
    gradient: 'linear-gradient(140deg, #DDD8FF 0%, #ECE4F8 100%)',
    color: '#6A5BBE',
  },
  {
    id: 'full_chat',
    a: 'My specialist can read',
    b: 'my full chat',
    body: 'Helps them understand your week in your own words.',
    gradient: 'linear-gradient(140deg, #CBECF5 0%, #D9F0EA 100%)',
    color: '#2F7889',
  },
]

const STEPS: { tone: Tone; variant: 'petals' | 'flower' }[] = [
  { tone: 'lavender', variant: 'petals' },
  { tone: 'teal', variant: 'petals' },
  { tone: 'peach', variant: 'petals' },
  { tone: 'sky', variant: 'petals' },
  { tone: 'peach', variant: 'flower' },
]

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { refresh, logout } = useAuth()
  const [step, setStep] = useState(0)
  const [nickname, setNickname] = useState('')
  const [language, setLanguage] = useState<Lang>('darija')
  const [consent, setConsent] = useState<Consent>('summary_only')
  const [emergencyName, setEmergencyName] = useState('')
  const [emergencyEmail, setEmergencyEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [chosen, setChosen] = useState<SpecialistCard | null>(null)

  const name = nickname.trim()
  const canContinue = step !== 0 || name.length > 0

  async function finish(skipContact: boolean) {
    setBusy(true)
    setError(null)
    try {
      await onboardPatient({
        nickname: name,
        language,
        consent,
        emergency_name: skipContact ? null : emergencyName.trim() || null,
        emergency_email: skipContact ? null : emergencyEmail.trim() || null,
        specialist_id: chosen?.id ?? null,
      })
      await refresh()
      navigate('/patient', { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your profile. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  function next() {
    if (!canContinue) return
    if (step < STEPS.length - 1) setStep(step + 1)
    else void finish(false)
  }

  return (
    <div className="relative mx-auto flex min-h-svh max-w-[430px] flex-col overflow-hidden lg:max-w-none">
      <Hero tone={STEPS[step].tone} variant={STEPS[step].variant} />
      <div className={cn('relative z-10 flex flex-1 flex-col px-5 pb-7 pt-6 lg:mx-auto lg:w-full lg:px-6', step === 2 ? 'lg:max-w-[1180px]' : 'lg:max-w-[560px]')}>
        <div className="flex items-center justify-between">
          <GlassCircle aria-label={step === 0 ? 'Log out' : 'Back'} onClick={() => (step === 0 ? void logout() : setStep(step - 1))}>
            <ArrowLeft className="size-5" />
          </GlassCircle>
          <Pill>
            Step {step + 1} of {STEPS.length}
          </Pill>
          <span className="w-[52px]" />
        </div>
        <div className="mt-5 grid grid-cols-5 gap-1.5" aria-hidden="true">
          {STEPS.map((_, i) => (
            <span key={i} className={cn('h-1 rounded-full', i <= step ? 'bg-ink' : 'bg-white/80')} />
          ))}
        </div>

        {step === 0 && (
          <section className="mt-16 flex flex-col gap-3">
            <Headline eyebrow="Welcome to Mindora" title="What should we call you?" />
            <div className="mt-6">
              <FieldLabel htmlFor="nick">First name or nickname</FieldLabel>
              <Field id="nick" autoFocus maxLength={40} placeholder="e.g. Yasmine" value={nickname} onChange={(e) => setNickname(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && next()} />
            </div>
            <Notice tone="info" icon={<Lock className="size-4" />} className="bg-white/80 bg-none text-ink-2 shadow-[var(--shadow-soft)]">
              No real name needed. Only you and your specialist see it, and Nour will use it to talk to you.
            </Notice>
          </section>
        )}

        {step === 1 && (
          <section className="mt-16 flex flex-col gap-3">
            <Headline eyebrow={`Nice to meet you, ${name}`} title="Which language feels like you?" />
            <div role="radiogroup" aria-label="Language" className="mt-6 flex flex-col gap-2.5">
              {LANGS.map((l) => (
                <ChoiceRow
                  key={l.id}
                  on={language === l.id}
                  onClick={() => setLanguage(l.id)}
                  label={<span lang={l.arabic ? 'ar' : undefined}>{l.label}</span>}
                  sub={l.sub}
                  labelClassName={l.arabic ? 'font-[family-name:var(--font-arabic)]' : undefined}
                />
              ))}
            </div>
            <p className="text-center text-[13px] text-sub">Nour will talk to you in this language.</p>
          </section>
        )}

        {step === 2 && (
          <section className="mt-10 flex flex-col gap-3">
            <Headline eyebrow="One weekly session, Nour in between" title="Choose your specialist" />
            <SpecialistPicker value={chosen} onChange={setChosen} />
          </section>
        )}

        {step === 3 && (
          <section className="mt-16 flex flex-col gap-3">
            <Headline eyebrow="Your choice, changeable anytime" title="What can your specialist see?" />
            <div role="radiogroup" aria-label="Privacy" className="mt-6 flex flex-col gap-3">
              {CONSENTS.map((c) => (
                <GradientChoice key={c.id} on={consent === c.id} onClick={() => setConsent(c.id)} gradient={c.gradient} className="flex flex-col gap-2">
                  <span className="pr-8 text-[21px] leading-tight tracking-[-0.4px]">
                    {c.a} <span style={{ color: c.color }}>{c.b}</span>
                  </span>
                  <span className="text-[13.5px] text-ink-2">{c.body}</span>
                </GradientChoice>
              ))}
            </div>
            <Notice icon={<ShieldAlert className="size-[18px]" fill="currentColor" stroke="#F9E4BB" />}>
              <strong className="font-semibold">Always shared, for your safety:</strong> if a message suggests you might be in danger, it goes to your specialist, whichever you pick.
            </Notice>
          </section>
        )}

        {step === 4 && (
          <section className="mt-16 flex flex-col gap-3">
            <Headline eyebrow="Optional · last step" title="Someone we can reach?" />
            <p className="text-center text-[15px] text-ink-2">A person you trust. They&apos;re only contacted in a crisis.</p>
            <div className="mt-3">
              <FieldLabel htmlFor="ename">Name</FieldLabel>
              <Field id="ename" placeholder="e.g. Mama, my brother Karim" value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} />
            </div>
            <div>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Field id="email" type="email" placeholder="name@mail.tn" value={emergencyEmail} onChange={(e) => setEmergencyEmail(e.target.value)} />
            </div>
            <button type="button" disabled={busy} onClick={() => void finish(true)} className="mx-auto mt-2 text-[15px] underline underline-offset-4">
              Skip for now
            </button>
          </section>
        )}

        <div className={cn('mt-auto flex flex-col gap-3 pt-8', step === 2 && 'lg:ml-auto lg:w-[420px]')}>
          {error && <Notice tone="error">{error}</Notice>}
          <Cta onClick={next} disabled={!canContinue} loading={busy && step === 4}>
            {step === 4 ? 'Start talking to Nour' : step === 2 && chosen ? `Continue with ${shortName(chosen.nickname)}` : 'Continue'}
          </Cta>
        </div>
      </div>
    </div>
  )
}
