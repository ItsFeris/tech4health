/** Login + sign-up for both roles (design: "1 · Login / Sign up"; desktop: S01 split screen). Dhia owns this file. */
import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { DEMO_LOGIN, useAuth } from '@/auth/AuthContext'
import { USE_MOCKS } from '@/api'
import type { Role } from '@/types/contract'
import { Cta, Field, FieldLabel, GlassCircle, GradientChoice, Headline, Hero, LogoGlyph, Notice, Pill } from '@/components/t4h/kit'
import { cn } from '@/lib/utils'

const ROLE_CARDS: { id: Role; label: string; gradient: string; accent: string }[] = [
  { id: 'patient', label: 'patient', gradient: 'linear-gradient(140deg, #CBECF5 0%, #D9F0EA 100%)', accent: '#3A8C9F' },
  { id: 'specialist', label: 'specialist', gradient: 'linear-gradient(140deg, #DDD8FF 0%, #ECE4F8 100%)', accent: '#7A69C8' },
]

export default function LoginPage() {
  const { me, needsOnboarding, login, signup, loginDemo } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [role, setRole] = useState<Role>('patient')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (me) return <Navigate to={`/${me.role}`} replace />
  if (needsOnboarding) return <Navigate to={`/${needsOnboarding}/onboarding`} replace />

  async function run(action: () => Promise<void>) {
    setError(null)
    setBusy(true)
    try {
      await action()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    void run(() => (mode === 'login' ? login(email, password) : signup(email, password, role)))
  }

  return (
    <div className="min-h-svh lg:flex">
      <BrandPanel />
      <div className="relative mx-auto min-h-svh max-w-[430px] overflow-hidden lg:mx-0 lg:flex lg:max-w-none lg:flex-[1_1_440px] lg:items-center lg:justify-center lg:bg-background">
      <div className="lg:hidden">
        <Hero tone="teal" />
      </div>
      <form onSubmit={submit} className="relative z-10 flex min-h-svh flex-col gap-3.5 px-[22px] pb-7 pt-6 lg:min-h-0 lg:w-full lg:max-w-[420px] lg:gap-4 lg:px-0 lg:py-12">
        <div className="flex items-center justify-between lg:hidden">
          <GlassCircle aria-label="Mindora">
            <LogoGlyph className="size-6" />
          </GlassCircle>
          <GlassCircle aria-label="Language: English" className="text-sm font-medium">
            EN
          </GlassCircle>
        </div>

        <Headline eyebrow="Care between sessions" title="Mindora" size="xl" className="mt-10 lg:hidden" />
        <div className="hidden lg:block">
          <p className="text-[15px] text-ink-2">{mode === 'signup' ? 'Welcome to Mindora' : 'Good to see you'}</p>
          <h2 className="mt-1 text-[40px] leading-tight tracking-[-1.3px]">{mode === 'signup' ? 'Create your account' : 'Welcome back'}</h2>
        </div>
        <div className="flex justify-center lg:hidden">
          <Pill>
            <ShieldCheck className="size-4" fill="currentColor" stroke="white" /> Private &amp; safe
          </Pill>
        </div>

        <div role="tablist" className="mt-5 grid grid-cols-2 lg:mt-0 rounded-full bg-white p-1 shadow-[var(--shadow-soft)]">
          {(['login', 'signup'] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={cn('h-[42px] rounded-full text-[15px] transition', mode === m ? 'bg-ink text-white' : 'text-sub')}
            >
              {m === 'login' ? 'Log in' : 'Sign up'}
            </button>
          ))}
        </div>

        {mode === 'signup' && (
          <div role="radiogroup" aria-label="I am a" className="grid grid-cols-2 gap-3">
            {ROLE_CARDS.map((r) => (
              <GradientChoice key={r.id} on={role === r.id} onClick={() => setRole(r.id)} gradient={r.gradient} className="flex h-[104px] items-end">
                <span className="text-[20px] leading-tight tracking-[-0.4px]">
                  I&apos;m a<br />
                  <span style={{ color: r.accent }}>{r.label}</span>
                </span>
              </GradientChoice>
            ))}
          </div>
        )}

        <div>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Field id="email" type="email" autoComplete="email" required placeholder="you@mail.tn" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Field
            id="password"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
            minLength={6}
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <Notice tone="error">{error}</Notice>}

        <Cta type="submit" loading={busy} className="mt-1">
          {mode === 'login' ? 'Log in' : `Create my ${role} account`}
        </Cta>

        {DEMO_LOGIN && (
          <div className="mt-auto rounded-[24px] bg-white/70 p-3 text-center shadow-[var(--shadow-soft)] lg:mt-2">
            <p className="text-[12px] text-sub">{USE_MOCKS ? 'Demo mode · mock data, no backend' : 'Demo mode · real backend, no Supabase'}</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button type="button" disabled={busy} onClick={() => void run(() => loginDemo('patient'))} className="h-10 rounded-full bg-ink text-sm text-white">
                Demo patient
              </button>
              <button type="button" disabled={busy} onClick={() => void run(() => loginDemo('specialist'))} className="h-10 rounded-full bg-[#DDD8FF] text-sm text-ink">
                Demo specialist
              </button>
            </div>
          </div>
        )}
      </form>
      </div>
    </div>
  )
}

/** Desktop left half (design S01): brand, promise, two feature cards over the teal petals. */
function BrandPanel() {
  return (
    <section className="relative hidden min-h-svh flex-[1_1_560px] flex-col overflow-hidden bg-[linear-gradient(140deg,#B3DFE5_0%,#C1E5EB_45%,#C7E3D0_100%)] px-12 py-10 lg:flex">
      <div aria-hidden="true" className="absolute -left-[60px] -top-20 size-[460px] -rotate-12 rounded-[100%_0_100%_0] border border-white/65 bg-[linear-gradient(135deg,rgba(255,255,255,.55),rgba(255,255,255,.06))]" />
      <div aria-hidden="true" className="absolute -right-[120px] top-20 size-[420px] rotate-[78deg] rounded-[100%_0_100%_0] border border-white/65 bg-[linear-gradient(135deg,rgba(255,255,255,.55),rgba(255,255,255,.06))]" />
      <div aria-hidden="true" className="absolute left-[18%] top-[200px] size-[520px] rounded-full border border-white/55 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,.55),rgba(255,255,255,.04))]" />

      <div className="relative flex items-center gap-3">
        <span className="flex size-[46px] items-center justify-center rounded-full border border-white/80 bg-white/55">
          <LogoGlyph className="size-[22px]" />
        </span>
        <span className="text-[19px] tracking-[-0.4px]">Mindora</span>
      </div>

      <div className="relative my-auto py-12 text-center">
        <p className="text-[18px] text-ink-2">For patients and their specialists</p>
        <h1 className="headline mt-1.5 text-[64px] leading-[1.02] tracking-[-2.2px]">
          Care between
          <br />
          sessions
        </h1>
        <Pill className="mt-6">
          <ShieldCheck className="size-4" fill="currentColor" stroke="white" /> Safety alerts built in
        </Pill>
        <div className="mt-12 flex flex-wrap justify-center gap-4">
          <div className="h-[150px] w-[230px] rounded-[24px] border border-white/90 bg-[linear-gradient(140deg,#D9F4F8_0%,#E6F6F1_100%)] p-[18px] text-left shadow-[0_16px_40px_rgba(40,80,90,.10)]">
            <p className="text-[24px] leading-[1.05] tracking-[-0.6px]">
              AI companion
              <span className="block text-[#3A8C9F]">all week</span>
            </p>
            <p className="mt-[18px] text-[14px] text-[#2F5C66]">Between weekly sessions</p>
          </div>
          <div className="mt-6 h-[150px] w-[230px] rounded-[24px] border border-white/90 bg-[linear-gradient(140deg,#DDD8FF_0%,#ECE4F8_100%)] p-[18px] text-left shadow-[0_16px_40px_rgba(60,40,120,.10)]">
            <p className="text-[24px] leading-[1.05] tracking-[-0.6px]">
              Live alerts
              <span className="block text-[#6A5BBE]">when it matters</span>
            </p>
            <p className="mt-[18px] text-[14px] text-[#4B3F8A]">Five safety layers</p>
          </div>
        </div>
      </div>
    </section>
  )
}
