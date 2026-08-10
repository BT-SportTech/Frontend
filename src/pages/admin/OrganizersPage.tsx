import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, FieldLabel, GlassPanel, TextInput } from '../../components/ui'
import { Modal } from '../../components/ui/Modal'
import {
  fetchOrganizers,
  inviteOrganizer,
  organizersKeys,
  resendOrganizerInvite,
  type OrganizerListItem,
  type PendingInvite,
} from '../../lib/queries/organizers'

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function formatRelativeExpiry(iso: string) {
  const expires = new Date(iso).getTime()
  const days = Math.ceil((expires - Date.now()) / (1000 * 60 * 60 * 24))
  if (days < 0) return 'Expired'
  if (days === 0) return 'Expires today'
  if (days === 1) return 'Expires tomorrow'
  return `Expires in ${days} days`
}

function displayName(firstName: string, lastName: string) {
  return `${titleCase(firstName)} ${titleCase(lastName)}`.trim()
}

function titleCase(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

function initials(firstName: string, lastName: string) {
  const first = firstName.trim().charAt(0)
  const last = lastName.trim().charAt(0)
  return `${first}${last}`.toUpperCase() || '?'
}

function Avatar({
  firstName,
  lastName,
  tone = 'primary',
}: {
  firstName: string
  lastName: string
  tone?: 'primary' | 'pending'
}) {
  const tones =
    tone === 'pending'
      ? 'border-amber-200 bg-amber-50 text-amber-800'
      : 'border-accent bg-accent/60 text-primary'
  return (
    <span
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${tones}`}
      aria-hidden
    >
      {initials(firstName, lastName)}
    </span>
  )
}

export function OrganizersPage() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [formError, setFormError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [resendingId, setResendingId] = useState<string | null>(null)

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
      setModalOpen(false)
      setSuccessMsg(
        'Invite sent. If SMTP is not configured, the invite link is in the backend console.',
      )
      await queryClient.invalidateQueries({ queryKey: organizersKeys.list() })
    },
    onError: (err) => {
      setFormError(err instanceof Error ? err.message : 'Invite failed')
    },
  })

  const resendMutation = useMutation({
    mutationFn: (inviteId: string) => resendOrganizerInvite(inviteId),
    onSuccess: async () => {
      setResendingId(null)
      setSuccessMsg('Invite resent.')
      await queryClient.invalidateQueries({ queryKey: organizersKeys.list() })
    },
    onError: (err) => {
      setResendingId(null)
      setSuccessMsg('')
      setFormError(err instanceof Error ? err.message : 'Resend failed')
    },
  })

  function openInvite() {
    setEmail('')
    setFirstName('')
    setLastName('')
    setFormError('')
    setModalOpen(true)
  }

  function onInvite(e: FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!email.trim() || !firstName.trim() || !lastName.trim()) {
      setFormError('Email, first name, and last name are required.')
      return
    }
    inviteMutation.mutate()
  }

  function onResend(inviteId: string) {
    setFormError('')
    setResendingId(inviteId)
    resendMutation.mutate(inviteId)
  }

  const organizers = listQuery.data?.organizers ?? []
  const pending = listQuery.data?.pendingInvites ?? []
  const loading = listQuery.isPending

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
            Organisers
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-ink/55">
            Invite employees by email. They set a password from the invite link
            — there is no self-registration.
          </p>
        </div>
        <Button type="button" onClick={openInvite}>
          Send invite
        </Button>
      </div>

      {successMsg ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-800">
          {successMsg}
        </p>
      ) : null}
      {formError && !modalOpen ? (
        <p className="rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-sm text-red-700">
          {formError}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <SummaryStat
          label="Active organisers"
          value={loading ? null : organizers.length}
          hint="Can be assigned to events"
        />
        <SummaryStat
          label="Pending invites"
          value={loading ? null : pending.length}
          hint="Awaiting password setup"
        />
      </div>

      <GlassPanel strong className="overflow-hidden">
        <SectionHeader
          title="Pending invites"
          count={loading ? undefined : pending.length}
        />
        {loading ? (
          <LoadingRows />
        ) : pending.length === 0 ? (
          <EmptyState
            title="No pending invites"
            description="Send an invite when you need to add another organiser."
            actionLabel="Send invite"
            onAction={openInvite}
          />
        ) : (
          <ul className="divide-y divide-line/60">
            {pending.map((invite) => (
              <PendingInviteRow
                key={invite.id}
                invite={invite}
                resending={resendingId === invite.id}
                onResend={() => onResend(invite.id)}
              />
            ))}
          </ul>
        )}
      </GlassPanel>

      <GlassPanel strong className="overflow-hidden">
        <SectionHeader
          title="Active organisers"
          count={loading ? undefined : organizers.length}
        />
        {loading ? (
          <LoadingRows />
        ) : organizers.length === 0 ? (
          <EmptyState
            title="No organisers yet"
            description="Invited people appear here after they accept and set a password."
            actionLabel="Send invite"
            onAction={openInvite}
          />
        ) : (
          <ul className="divide-y divide-line/60">
            {organizers.map((org) => (
              <ActiveOrganizerRow key={org.id} organizer={org} />
            ))}
          </ul>
        )}
      </GlassPanel>

      <Modal
        open={modalOpen}
        title="Send invite"
        onClose={() => {
          if (!inviteMutation.isPending) setModalOpen(false)
        }}
      >
        <form onSubmit={onInvite} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>First name</FieldLabel>
              <TextInput
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div>
              <FieldLabel>Last name</FieldLabel>
              <TextInput
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <FieldLabel>Email</FieldLabel>
            <TextInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@company.com"
            />
          </div>
          {formError ? (
            <p className="rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-sm text-red-700">
              {formError}
            </p>
          ) : null}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              disabled={inviteMutation.isPending}
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={inviteMutation.isPending}>
              {inviteMutation.isPending ? 'Sending…' : 'Send invite'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function SummaryStat({
  label,
  value,
  hint,
}: {
  label: string
  value: number | null
  hint: string
}) {
  return (
    <GlassPanel className="px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink/45">
        {label}
      </p>
      <p className="mt-1 font-display text-3xl font-bold tabular-nums tracking-tight text-ink">
        {value === null ? '—' : value}
      </p>
      <p className="mt-1 text-xs text-ink/50">{hint}</p>
    </GlassPanel>
  )
}

function SectionHeader({
  title,
  count,
}: {
  title: string
  count?: number
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line/70 px-5 py-3.5">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      {typeof count === 'number' ? (
        <span className="inline-flex min-w-7 items-center justify-center rounded-md bg-accent/70 px-2 py-0.5 text-xs font-semibold tabular-nums text-primary">
          {count}
        </span>
      ) : null}
    </div>
  )
}

function PendingInviteRow({
  invite,
  resending,
  onResend,
}: {
  invite: PendingInvite
  resending: boolean
  onResend: () => void
}) {
  const expired = new Date(invite.expiresAt).getTime() < Date.now()
  return (
    <li className="flex flex-wrap items-center gap-3 px-5 py-3.5 transition hover:bg-accent/20 sm:flex-nowrap">
      <Avatar
        firstName={invite.firstName}
        lastName={invite.lastName}
        tone="pending"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-ink">
          {displayName(invite.firstName, invite.lastName)}
        </p>
        <p className="truncate text-sm text-ink/55">{invite.email}</p>
      </div>
      <div className="w-full sm:w-auto sm:text-right">
        <p
          className={`text-xs font-semibold ${
            expired ? 'text-red-600' : 'text-amber-700'
          }`}
        >
          {formatRelativeExpiry(invite.expiresAt)}
        </p>
        <p className="mt-0.5 text-xs text-ink/45">
          {formatWhen(invite.expiresAt)}
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        className="!px-3 !py-2"
        disabled={resending}
        onClick={onResend}
      >
        {resending ? 'Sending…' : 'Resend'}
      </Button>
    </li>
  )
}

function ActiveOrganizerRow({
  organizer,
}: {
  organizer: OrganizerListItem
}) {
  return (
    <li className="flex flex-wrap items-center gap-3 px-5 py-3.5 transition hover:bg-accent/20 sm:flex-nowrap">
      <Avatar firstName={organizer.firstName} lastName={organizer.lastName} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-ink">
          {displayName(organizer.firstName, organizer.lastName)}
        </p>
        <p className="truncate text-sm text-ink/55">
          {organizer.email ?? '—'}
          <span className="text-ink/30"> · </span>
          <span className="text-ink/70">@{organizer.username}</span>
        </p>
      </div>
      <span className="inline-flex items-center rounded-md bg-secondary/10 px-2.5 py-1 text-xs font-semibold text-secondary">
        {organizer.assignedEventsCount}{' '}
        {organizer.assignedEventsCount === 1 ? 'event' : 'events'}
      </span>
      <div className="w-full text-left sm:w-36 sm:text-right">
        <p className="text-xs font-medium text-ink/45">Joined</p>
        <p className="text-sm text-ink/70">{formatWhen(organizer.createdAt)}</p>
      </div>
    </li>
  )
}

function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string
  description: string
  actionLabel: string
  onAction: () => void
}) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-line bg-accent/40 text-primary">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          aria-hidden
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <line x1="19" x2="19" y1="8" y2="14" />
          <line x1="22" x2="16" y1="11" y2="11" />
        </svg>
      </span>
      <p className="mt-3 text-sm font-semibold text-ink">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-ink/50">{description}</p>
      <Button type="button" className="mt-4" onClick={onAction}>
        {actionLabel}
      </Button>
    </div>
  )
}

function LoadingRows() {
  return (
    <div className="space-y-3 px-5 py-5" aria-busy>
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="skeleton h-10 w-10 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="skeleton h-3.5 w-40 rounded" />
            <div className="skeleton h-3 w-56 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}
