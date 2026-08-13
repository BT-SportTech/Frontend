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
import { toast } from '../../stores/useToastStore'

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
      ? 'border-amber-200/80 bg-gradient-to-br from-amber-100 to-orange-50 text-amber-800 shadow-sm shadow-amber-200/40'
      : 'border-primary/20 bg-gradient-to-br from-primary/15 via-accent to-primary/10 text-primary shadow-sm shadow-primary/10'
  return (
    <span
      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-sm font-bold ${tones}`}
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
      toast.success(
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
      toast.success('Invite resent.')
      await queryClient.invalidateQueries({ queryKey: organizersKeys.list() })
    },
    onError: (err) => {
      setResendingId(null)
      toast.error(err instanceof Error ? err.message : 'Resend failed')
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
    setResendingId(inviteId)
    resendMutation.mutate(inviteId)
  }

  const organizers = listQuery.data?.organizers ?? []
  const pending = listQuery.data?.pendingInvites ?? []
  const loading = listQuery.isPending

  return (
    <div className="space-y-6 animate-fade-in">
      <GlassPanel
        strong
        className="relative overflow-hidden border-primary/10 bg-gradient-to-br from-white via-white to-primary/[0.06] p-6 sm:p-8"
      >
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-secondary/10 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div className="flex gap-4">
            <span
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-gradient-to-br from-primary to-primary-hover text-white shadow-lg shadow-primary/25"
              aria-hidden
            >
              <UsersIcon className="h-6 w-6" />
            </span>
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                Organisers
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink/60 sm:text-base">
                Invite employees by email. They set a password from the invite
                link — there is no self-registration.
              </p>
            </div>
          </div>
          <Button
            type="button"
            onClick={openInvite}
            className="shadow-md shadow-primary/25 !px-5"
          >
            <MailIcon className="mr-2 h-4 w-4" />
            Send invite
          </Button>
        </div>
      </GlassPanel>

      <div className="grid gap-4 sm:grid-cols-2">
        <SummaryStat
          label="Active organisers"
          value={loading ? null : organizers.length}
          hint="Can be assigned to events"
          accent="primary"
          icon={<UserCheckIcon className="h-5 w-5" />}
        />
        <SummaryStat
          label="Pending invites"
          value={loading ? null : pending.length}
          hint="Awaiting password setup"
          accent="amber"
          icon={<ClockIcon className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassPanel strong className="overflow-hidden">
          <SectionHeader
            title="Pending invites"
            count={loading ? undefined : pending.length}
            tone="amber"
            icon={<ClockIcon className="h-4 w-4" />}
            description="Invites waiting for acceptance"
          />
          {loading ? (
            <LoadingRows />
          ) : pending.length === 0 ? (
            <EmptyState
              title="No pending invites"
              description="Send an invite when you need to add another organiser."
              actionLabel="Send invite"
              onAction={openInvite}
              tone="amber"
            />
          ) : (
            <ul className="space-y-2 p-4 pt-2">
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
            tone="primary"
            icon={<UserCheckIcon className="h-4 w-4" />}
            description="Ready to manage events"
          />
          {loading ? (
            <LoadingRows />
          ) : organizers.length === 0 ? (
            <EmptyState
              title="No organisers yet"
              description="Invited people appear here after they accept and set a password."
              actionLabel="Send invite"
              onAction={openInvite}
              tone="primary"
            />
          ) : (
            <ul className="space-y-2 p-4 pt-2">
              {organizers.map((org) => (
                <ActiveOrganizerRow key={org.id} organizer={org} />
              ))}
            </ul>
          )}
        </GlassPanel>
      </div>

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
  accent,
  icon,
}: {
  label: string
  value: number | null
  hint: string
  accent: 'primary' | 'amber'
  icon: React.ReactNode
}) {
  const accentStyles =
    accent === 'primary'
      ? {
          bar: 'bg-primary',
          label: 'text-primary',
          iconBg: 'bg-primary/10 text-primary',
          glow: 'from-primary/8',
        }
      : {
          bar: 'bg-amber-500',
          label: 'text-amber-700',
          iconBg: 'bg-amber-100 text-amber-700',
          glow: 'from-amber-500/10',
        }

  return (
    <GlassPanel
      strong
      className="relative overflow-hidden px-5 py-5 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div
        className={`absolute inset-y-0 left-0 w-1 ${accentStyles.bar}`}
        aria-hidden
      />
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accentStyles.glow} to-transparent`}
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p
            className={`text-xs font-semibold uppercase tracking-wide ${accentStyles.label}`}
          >
            {label}
          </p>
          <p className="mt-2 font-display text-4xl font-bold tabular-nums tracking-tight text-ink">
            {value === null ? '—' : value}
          </p>
          <p className="mt-1.5 text-xs text-ink/55">{hint}</p>
        </div>
        <span
          className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accentStyles.iconBg}`}
          aria-hidden
        >
          {icon}
        </span>
      </div>
    </GlassPanel>
  )
}

function SectionHeader({
  title,
  count,
  tone,
  icon,
  description,
}: {
  title: string
  count?: number
  tone: 'primary' | 'amber'
  icon: React.ReactNode
  description: string
}) {
  const toneStyles =
    tone === 'primary'
      ? {
          bg: 'bg-gradient-to-r from-primary/8 via-primary/4 to-transparent',
          badge: 'bg-primary text-white shadow-sm shadow-primary/25',
          icon: 'bg-primary/10 text-primary',
        }
      : {
          bg: 'bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent',
          badge: 'bg-amber-500 text-white shadow-sm shadow-amber-500/25',
          icon: 'bg-amber-100 text-amber-700',
        }

  return (
    <div
      className={`flex items-center justify-between gap-3 border-b border-line/70 px-5 py-4 ${toneStyles.bg}`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${toneStyles.icon}`}
          aria-hidden
        >
          {icon}
        </span>
        <div>
          <h2 className="text-base font-bold text-ink">{title}</h2>
          <p className="text-xs text-ink/50">{description}</p>
        </div>
      </div>
      {typeof count === 'number' ? (
        <span
          className={`inline-flex min-w-8 items-center justify-center rounded-full px-2.5 py-1 text-xs font-bold tabular-nums ${toneStyles.badge}`}
        >
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
    <li
      className="group flex flex-wrap items-center gap-3 rounded-xl border border-line/60 bg-white/60 px-4 py-3.5 transition hover:border-amber-200/80 hover:bg-amber-50/40 hover:shadow-sm sm:flex-nowrap"
    >
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
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
            expired
              ? 'bg-red-100 text-red-700'
              : 'bg-amber-100 text-amber-800'
          }`}
        >
          {formatRelativeExpiry(invite.expiresAt)}
        </span>
        <p className="mt-1 text-xs text-ink/45">{formatWhen(invite.expiresAt)}</p>
      </div>
      <Button
        type="button"
        variant="ghost"
        className="!border-amber-200/80 !px-3 !py-2 hover:!bg-amber-100/60"
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
    <li
      className="group flex flex-wrap items-center gap-3 rounded-xl border border-line/60 bg-white/60 px-4 py-3.5 transition hover:border-primary/20 hover:bg-primary/[0.04] hover:shadow-sm sm:flex-nowrap"
    >
      <Avatar firstName={organizer.firstName} lastName={organizer.lastName} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-ink">
          {displayName(organizer.firstName, organizer.lastName)}
        </p>
        <p className="truncate text-sm text-ink/55">
          {organizer.email ?? '—'}
          <span className="text-ink/30"> · </span>
          <span className="font-medium text-primary/80">
            @{organizer.username}
          </span>
        </p>
      </div>
      <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2.5 py-1 text-xs font-semibold text-secondary">
        <CalendarIcon className="h-3.5 w-3.5" aria-hidden />
        {organizer.assignedEventsCount}{' '}
        {organizer.assignedEventsCount === 1 ? 'event' : 'events'}
      </span>
      <div className="w-full text-left sm:w-36 sm:text-right">
        <p className="text-xs font-medium text-ink/45">Joined</p>
        <p className="text-sm font-medium text-ink/70">
          {formatWhen(organizer.createdAt)}
        </p>
      </div>
    </li>
  )
}

function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  tone,
}: {
  title: string
  description: string
  actionLabel: string
  onAction: () => void
  tone: 'primary' | 'amber'
}) {
  const iconTone =
    tone === 'primary'
      ? 'border-primary/20 bg-primary/10 text-primary'
      : 'border-amber-200 bg-amber-50 text-amber-700'

  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span
        className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl border ${iconTone}`}
      >
        <UsersIcon className="h-6 w-6" aria-hidden />
      </span>
      <p className="mt-4 text-base font-semibold text-ink">{title}</p>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink/55">
        {description}
      </p>
      <Button type="button" className="mt-5" onClick={onAction}>
        {actionLabel}
      </Button>
    </div>
  )
}

function LoadingRows() {
  return (
    <div className="space-y-3 p-5" aria-busy>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-xl border border-line/50 px-4 py-3"
        >
          <div className="skeleton h-11 w-11 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="skeleton h-3.5 w-40 rounded" />
            <div className="skeleton h-3 w-56 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function UserCheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <polyline points="16 11 18 13 22 9" />
    </svg>
  )
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  )
}
