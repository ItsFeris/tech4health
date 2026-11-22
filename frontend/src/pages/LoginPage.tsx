/** Login + sign-up for both roles (design: "1 · Login / Sign up"). Dhia owns this file. */
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
    <div className="relative mx-auto min-h-svh max-w-[430px] overflow-hidden">
      <Hero tone="teal" />
      <form onSubmit={submit} className="relative z-10 flex min-h-svh flex-col gap-3.5 px-[22px] pb-7 pt-6">
        <div className="flex items-center justify-between">
          <GlassCircle aria-label="Tech4Health">
            <LogoGlyph className="size-6" />
          </GlassCircle>
          <GlassCircle aria-label="Language: English" className="text-sm font-medium">
            EN
          </GlassCircle>
        </div>

        <Headline eyebrow="Care between sessions" title="Tech4Health" size="xl" className="mt-10" />
        <div className="flex justify-center">
          <Pill>
            <ShieldCheck className="size-4" fill="currentColor" stroke="white" /> Private &amp; safe
          </Pill>
        </div>

        <div role="tablist" className="mt-5 grid grid-cols-2 rounded-full bg-white p-1 shadow-[var(--shadow-soft)]">
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
          <div className="mt-auto rounded-[24px] bg-white/70 p-3 text-center shadow-[var(--shadow-soft)]">
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
  )
}
