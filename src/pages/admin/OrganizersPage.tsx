import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, GlassPanel, Skeleton } from '../../components/ui'
import {
  fetchOrganizers,
  inviteOrganizer,
  organizersKeys,
  resendOrganizerInvite,
} from '../../lib/queries/organizers'

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function OrganizersPage() {
  const queryClient = useQueryClient()
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [formError, setFormError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const listQuery = useQuery({
    queryKey: organizersKeys.list(),
    queryFn: fetchOrganizers,
  })

  const inviteMutation = useMutation({
    mutationFn: () =>
      inviteOrganizer({
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      }),
    onSuccess: async () => {
      setEmail('')
      setFirstName('')
      setLastName('')
      setFormError('')
      setSuccessMsg(
        'Invite sent. If SMTP is not configured, the invite link is in the backend console.',
      )
      await queryClient.invalidateQueries({ queryKey: organizersKeys.list() })
    },
    onError: (err) => {
      setSuccessMsg('')
      setFormError(err instanceof Error ? err.message : 'Invite failed')
    },
  })

  const resendMutation = useMutation({
    mutationFn: (inviteId: string) => resendOrganizerInvite(inviteId),
    onSuccess: async () => {
      setSuccessMsg('Invite resent.')
      await queryClient.invalidateQueries({ queryKey: organizersKeys.list() })
    },
    onError: (err) => {
      setFormError(err instanceof Error ? err.message : 'Resend failed')
    },
  })

  function onInvite(e: FormEvent) {
    e.preventDefault()
    setFormError('')
    setSuccessMsg('')
    if (!email.trim() || !firstName.trim() || !lastName.trim()) {
      setFormError('Email, first name, and last name are required.')
      return
    }
    inviteMutation.mutate()
  }

  const organizers = listQuery.data?.organizers ?? []
  const pending = listQuery.data?.pendingInvites ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
          Organisers
        </h1>
        <p className="mt-1.5 text-sm text-ink/55">
          Invite employees by email. They set a password from the invite link —
          there is no self-registration.
        </p>
      </div>

      <GlassPanel className="p-6">
        <h2 className="text-lg font-semibold text-ink">Send invite</h2>
        <form
          onSubmit={onInvite}
          className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <label className="block text-sm font-semibold text-ink">
            First name
            <input
              className="mt-1.5 w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none ring-primary/30 focus:ring-2"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm font-semibold text-ink">
            Last name
            <input
              className="mt-1.5 w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none ring-primary/30 focus:ring-2"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm font-semibold text-ink sm:col-span-2 lg:col-span-1">
            Email
            <input
              type="email"
              className="mt-1.5 w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none ring-primary/30 focus:ring-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <div className="flex items-end">
            <Button
              type="submit"
              className="w-full"
              disabled={inviteMutation.isPending}
            >
              {inviteMutation.isPending ? 'Sending…' : 'Send invite'}
            </Button>
          </div>
        </form>
        {formError ? (
          <p className="mt-3 rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-sm text-red-700">
            {formError}
          </p>
        ) : null}
        {successMsg ? (
          <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-800">
            {successMsg}
          </p>
        ) : null}
      </GlassPanel>

      <GlassPanel className="overflow-hidden p-0">
        <div className="border-b border-line/70 px-6 py-4">
          <h2 className="text-lg font-semibold text-ink">Pending invites</h2>
        </div>
        {listQuery.isPending ? (
          <div className="space-y-2 p-6">
            <Skeleton className="h-10 w-full" />
          </div>
        ) : pending.length === 0 ? (
          <p className="p-6 text-sm text-ink/55">No pending invites.</p>
        ) : (
          <ul className="divide-y divide-line/60">
            {pending.map((invite) => (
              <li
                key={invite.id}
                className="flex flex-wrap items-center justify-between gap-3 px-6 py-3"
              >
                <div>
                  <p className="font-semibold text-ink">
                    {invite.firstName} {invite.lastName}
                  </p>
                  <p className="text-xs text-ink/50">
                    {invite.email} · expires {formatWhen(invite.expiresAt)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={resendMutation.isPending}
                  onClick={() => resendMutation.mutate(invite.id)}
                >
                  Resend
                </Button>
              </li>
            ))}
          </ul>
        )}
      </GlassPanel>

      <GlassPanel className="overflow-hidden p-0">
        <div className="border-b border-line/70 px-6 py-4">
          <h2 className="text-lg font-semibold text-ink">Active organisers</h2>
        </div>
        {listQuery.isPending ? (
          <div className="space-y-2 p-6">
            <Skeleton className="h-10 w-full" />
          </div>
        ) : organizers.length === 0 ? (
          <p className="p-6 text-sm text-ink/55">No organisers yet.</p>
        ) : (
          <ul className="divide-y divide-line/60">
            {organizers.map((org) => (
              <li key={org.id} className="px-6 py-3">
                <p className="font-semibold text-ink">
                  {org.firstName} {org.lastName}
                </p>
                <p className="text-xs text-ink/50">
                  {org.email} · @{org.username} · {org.assignedEventsCount}{' '}
                  assigned event{org.assignedEventsCount === 1 ? '' : 's'}
                </p>
              </li>
            ))}
          </ul>
        )}
      </GlassPanel>
    </div>
  )
}
