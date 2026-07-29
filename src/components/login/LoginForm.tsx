import { Button, GlassPanel } from '../ui'
import { useLoginForm } from '../../hooks/useLoginForm'
import { LoginFormField } from './LoginFormField'

export function LoginForm() {
  const { values, fieldErrors, submitError, loading, setField, handleSubmit } =
    useLoginForm()

  return (
    <section className="relative flex flex-1 items-center justify-center app-backdrop px-6 py-12 lg:px-12">
      <GlassPanel strong className="animate-rise w-full max-w-md p-8 sm:p-10">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
          Sign in
        </h1>
        <p className="mt-1.5 text-sm text-ink/55">
          Use your SportTech admin credentials
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
          <LoginFormField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(event) => setField('email', event.target.value)}
            placeholder="admin@sporttech.com"
            error={fieldErrors.email}
          />

          <LoginFormField
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={values.password}
            onChange={(event) => setField('password', event.target.value)}
            placeholder="••••••••"
            error={fieldErrors.password}
          />

          {submitError ? (
            <p
              className="rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-sm text-red-700"
              role="alert"
            >
              {submitError}
            </p>
          ) : null}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </GlassPanel>
    </section>
  )
}
