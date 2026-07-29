import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Button, FieldLabel, GlassPanel, TextInput } from '../components/ui'
import loginSection from '../assets/Login_section.png'

export function LoginPage() {
  const { login, isAuthenticated, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthenticated && isAdmin) {
    return <Navigate to="/admin" replace />
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email.trim(), password)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      {/* Left brand column */}
      <section className="relative flex min-h-[40vh] flex-1 flex-col justify-start overflow-hidden px-8 py-10 lg:min-h-full lg:px-14 lg:py-16">
        <img
          src={loginSection}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/50 via-transparent to-transparent" />
        <div className="relative z-10 animate-fade-in">
          <p className="font-display text-5xl font-bold tracking-tight text-white drop-shadow-sm sm:text-6xl lg:text-7xl">
            SportTech
          </p>
          <p className="mt-3 max-w-sm text-lg font-medium text-accent">
            Admin console
          </p>
        </div>
      </section>

      {/* Right form column */}
      <section className="relative flex flex-1 items-center justify-center app-backdrop px-6 py-12 lg:px-12">
        <GlassPanel
          strong
          className="animate-rise w-full max-w-md p-8 sm:p-10"
        >
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
            Sign in
          </h1>
          <p className="mt-1.5 text-sm text-ink/55">
            Use your SportTech admin credentials
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div>
              <FieldLabel>Email</FieldLabel>
              <TextInput
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@sporttech.com"
              />
            </div>
            <div>
              <FieldLabel>Password</FieldLabel>
              <TextInput
                type="password"
                autoComplete="current-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error ? (
              <p className="rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </GlassPanel>
      </section>
    </div>
  )
}
