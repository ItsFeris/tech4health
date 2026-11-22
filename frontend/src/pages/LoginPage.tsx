/** Login + signup for both roles. DHIA ONLY (A may restyle later with Dhia's OK). */
import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DEMO_LOGIN, useAuth } from '@/auth/AuthContext'
import { USE_MOCKS } from '@/api'
import type { Role } from '@/types/contract'

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

  async function demo(r: Role) {
    setError(null)
    try { await loginDemo(r) }
    catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong') }
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (mode === 'login') await login(email, password)
      else await signup(email, password, role)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="relative flex min-h-svh items-center justify-center p-5 overflow-hidden"
      style={{ backgroundColor: C.bg, fontFamily: 'sans-serif' }}
    >
      {/* Organic background shapes */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-24 -left-24 size-80 rounded-full opacity-40"
          style={{ backgroundColor: C.sageMid }}
        />
        <div
          className="absolute -bottom-20 -right-20 size-64 rounded-full opacity-25"
          style={{ backgroundColor: C.sageLight }}
        />
        <div
          className="absolute top-1/2 right-1/4 size-48 rounded-full opacity-20"
          style={{ backgroundColor: C.sageMid }}
        />
        {/* Landscape silhouette */}
        <svg
          viewBox="0 0 400 200"
          className="absolute bottom-0 left-0 w-full opacity-20"
          preserveAspectRatio="none"
        >
          <ellipse cx="100" cy="200" rx="200" ry="100" fill={C.sageMid} />
          <ellipse cx="340" cy="200" rx="180" ry="90" fill={C.sage} />
          <ellipse cx="200" cy="200" rx="280" ry="70" fill={C.dark} />
        </svg>
      </div>

      {/* Card */}
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-3xl shadow-2xl"
        style={{ backgroundColor: C.cream }}
      >
        {/* Top landscape banner */}
        <div
          className="relative overflow-hidden"
          style={{ backgroundColor: C.dark, height: 120 }}
        >
          <svg viewBox="0 0 320 120" className="absolute inset-0 size-full">
            {/* Sky */}
            <rect width="320" height="120" fill="#2C3A2C" />
            {/* Sun */}
            <circle cx="160" cy="65" r="35" fill="#F2EFE9" opacity="0.15" />
            <circle cx="160" cy="65" r="22" fill="#F2EFE9" opacity="0.2" />
            {/* Hills */}
            <ellipse cx="60" cy="120" rx="140" ry="70" fill="#3D4F3D" />
            <ellipse cx="270" cy="120" rx="130" ry="65" fill="#4A5E4A" />
            <ellipse cx="160" cy="120" rx="200" ry="50" fill="#1E2A1E" />
            {/* Leaf */}
            <path d="M148 30 Q160 12 172 30 Q160 45 148 30Z" fill={C.sageMid} opacity="0.6" />
            <line x1="160" y1="30" x2="160" y2="52" stroke={C.sageMid} strokeWidth="1.5" opacity="0.6" />
          </svg>
          {/* Title overlay */}
          <div className="absolute inset-0 flex flex-col justify-end p-5">
            <h1
              className="text-2xl font-bold"
              style={{ color: C.cream, fontFamily: 'Georgia, serif' }}
            >
              Tech4Health
            </h1>
            <p className="text-xs" style={{ color: C.sageMid }}>
              Support entre vos séances, dans votre langue.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 p-6">
          {/* Demo mode banner */}
          {DEMO_LOGIN && (
            <div
              className="flex flex-col gap-2 rounded-2xl p-3"
              style={{ backgroundColor: C.sageLight }}
            >
              <p className="text-[11px]" style={{ color: C.muted }}>
                {USE_MOCKS ? 'Demo mode (mock data, no backend)' : 'Demo mode (real backend, no Supabase)'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => void demo('patient')}
                  className="rounded-xl py-2.5 text-xs font-bold transition-all hover:opacity-90"
                  style={{ backgroundColor: C.dark, color: C.cream }}
                >
                  Demo patient
                </button>
                <button
                  onClick={() => void demo('specialist')}
                  className="rounded-xl border py-2.5 text-xs font-bold transition-all hover:opacity-80"
                  style={{ borderColor: C.sageMid, backgroundColor: C.cream, color: C.dark }}
                >
                  Demo specialist
                </button>
              </div>
            </div>
          )}

          {error && DEMO_LOGIN && (
            <p className="text-xs" style={{ color: '#8B4A4A' }}>{error}</p>
          )}

          {/* Form */}
          <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-xs font-semibold" style={{ color: C.darkMid }}>
                Email
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl border-0 text-sm focus-visible:ring-1"
                style={{ backgroundColor: C.sageLight, color: C.dark }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password" className="text-xs font-semibold" style={{ color: C.darkMid }}>
                Password
              </Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-xl border-0 text-sm focus-visible:ring-1"
                style={{ backgroundColor: C.sageLight, color: C.dark }}
              />
            </div>

            {/* Role selector for signup */}
            {mode === 'signup' && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('patient')}
                  className="rounded-xl py-2.5 text-xs font-bold transition-all"
                  style={
                    role === 'patient'
                      ? { backgroundColor: C.dark, color: C.cream }
                      : { backgroundColor: C.sageLight, color: C.muted }
                  }
                >
                  Je suis patient
                </button>
                <button
                  type="button"
                  onClick={() => setRole('specialist')}
                  className="rounded-xl py-2.5 text-xs font-bold transition-all"
                  style={
                    role === 'specialist'
                      ? { backgroundColor: C.dark, color: C.cream }
                      : { backgroundColor: C.sageLight, color: C.muted }
                  }
                >
                  Je suis spécialiste
                </button>
              </div>
            )}

            {error && !DEMO_LOGIN && (
              <p className="text-xs" style={{ color: '#8B4A4A' }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="mt-1 w-full rounded-2xl py-4 text-sm font-bold shadow-md transition-all hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: C.dark, color: C.cream }}
            >
              {busy ? 'Chargement...' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
            </button>
          </form>

          {/* Toggle mode */}
          <button
            type="button"
            className="text-center text-xs underline underline-offset-2 transition-opacity hover:opacity-70"
            style={{ color: C.muted }}
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          >
            {mode === 'login' ? "Pas encore de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
          </button>
        </div>
      </div>
    </div>
  )
}
