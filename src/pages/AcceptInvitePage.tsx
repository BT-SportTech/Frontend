import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Button, GlassPanel, Skeleton } from '../components/ui'
import {
  acceptOrganizerInvite,
  fetchInvitePreview,
  organizersKeys,
} from '../lib/queries/organizers'
import { useAuthStore } from '../stores/useAuthStore'

export function AcceptInvitePage() {
  const { token = '' } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const acceptInviteSession = useAuthStore((s) => s.acceptInviteSession)

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [username, setUsername] = useState('')
  const [formError, setFormError] = useState('')

  const inviteQuery = useQuery({
    queryKey: organizersKeys.invite(token),
    queryFn: () => fetchInvitePreview(token),
    enabled: Boolean(token),
    retry: false,
  })

  useEffect(() => {
    if (inviteQuery.data?.email) {
      const local = inviteQuery.data.email.split('@')[0] ?? ''
      setUsername(local.replace(/[^a-zA-Z0-9._]/g, '_').toLowerCase())
    }
  }, [inviteQuery.data?.email])

  const acceptMutation = useMutation({
    mutationFn: () =>
      acceptOrganizerInvite({
        token,
        password,
        username: username.trim() || undefined,
      }),
    onSuccess: (data) => {
      acceptInviteSession(data)
      navigate('/organizer', { replace: true })
    },
    onError: (err) => {
      setFormError(err instanceof Error ? err.message : 'Unable to accept invite')
    },
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError('')
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setFormError('Passwords do not match.')
      return
    }
    acceptMutation.mutate()
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-[radial-gradient(ellipse_at_top,_#e8f5ef_0%,_#f7faf8_45%,_#eef2f0_100%)] px-4 py-12">
      <GlassPanel className="w-full max-w-md p-8">
        <p className="font-display text-2xl font-bold tracking-tight text-primary">
          SportTech
        </p>
        <h1 className="mt-2 text-xl font-semibold text-ink">
          Accept organiser invite
        </h1>

        {inviteQuery.isPending ? (
          <div className="mt-6 space-y-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : inviteQuery.isError ? (
          <div className="mt-6 space-y-4">
            <p className="rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-sm text-red-700">
              {inviteQuery.error instanceof Error
                ? inviteQuery.error.message
                : 'Invite is invalid or expired.'}
            </p>
            <Link
              to="/login"
              className="text-sm font-semibold text-primary hover:text-primary-hover"
            >
              Back to login
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm text-ink/60">
              Welcome, {inviteQuery.data.firstName} {inviteQuery.data.lastName}.
              Set a password for{' '}
              <span className="font-semibold text-ink">
                {inviteQuery.data.email}
              </span>
              .
            </p>
            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <label className="block text-sm font-semibold text-ink">
                Username
                <input
                  className="mt-1.5 w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none ring-primary/30 focus:ring-2"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                />
              </label>
              <label className="block text-sm font-semibold text-ink">
                Password
                <input
                  type="password"
                  className="mt-1.5 w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none ring-primary/30 focus:ring-2"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </label>
              <label className="block text-sm font-semibold text-ink">
                Confirm password
                <input
                  type="password"
                  className="mt-1.5 w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none ring-primary/30 focus:ring-2"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </label>
              {formError ? (
                <p className="rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-sm text-red-700">
                  {formError}
                </p>
              ) : null}
              <Button
                type="submit"
                className="w-full"
                disabled={acceptMutation.isPending}
              >
                {acceptMutation.isPending
                  ? 'Creating account…'
                  : 'Create account & continue'}
              </Button>
            </form>
          </>
        )}
      </GlassPanel>
    </div>
  )
}
