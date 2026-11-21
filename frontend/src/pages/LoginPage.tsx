/** Login + signup for both roles. DHIA ONLY (A may restyle later with Dhia's OK). */
import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DEMO_LOGIN, useAuth } from '@/auth/AuthContext'
import { USE_MOCKS } from '@/api'
import type { Role } from '@/types/contract'

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
    try {
      await loginDemo(r)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    }
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
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Tech4Health</CardTitle>
          <CardDescription>Support between your sessions, in your language.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {DEMO_LOGIN && (
            <div className="bg-muted flex flex-col gap-2 rounded-lg p-3">
              <p className="text-muted-foreground text-xs">{USE_MOCKS ? 'Demo mode (mock data, no backend)' : 'Demo mode (real backend, no Supabase)'}</p>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => void demo('patient')}>Demo patient</Button>
                <Button variant="secondary" onClick={() => void demo('specialist')}>
                  Demo specialist
                </Button>
              </div>
            </div>
          )}
          {error && DEMO_LOGIN && <p className="text-destructive text-sm">{error}</p>}
          <form onSubmit={submit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {mode === 'signup' && (
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant={role === 'patient' ? 'default' : 'outline'} onClick={() => setRole('patient')}>
                  I'm a patient
                </Button>
                <Button type="button" variant={role === 'specialist' ? 'default' : 'outline'} onClick={() => setRole('specialist')}>
                  I'm a specialist
                </Button>
              </div>
            )}
            {error && !DEMO_LOGIN && <p className="text-destructive text-sm">{error}</p>}
            <Button type="submit" disabled={busy}>
              {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
            </Button>
          </form>
          <button type="button" className="text-muted-foreground text-sm underline" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
            {mode === 'login' ? 'No account yet? Sign up' : 'Already have an account? Log in'}
          </button>
        </CardContent>
      </Card>
    </div>
  )
}
