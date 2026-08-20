import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, FieldLabel, TextInput } from '../../components/ui'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatGrid } from '@/components/layout/StatGrid'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
      <PageHeader
        title="Organisers"
        description="Invite employees by email. They set a password from the invite link — there is no self-registration."
        actions={
          <Button type="button" onClick={openInvite}>
            Send invite
          </Button>
        }
      />

      <StatGrid
        items={[
          {
            label: 'Active organisers',
            value: loading ? '—' : organizers.length,
            hint: 'Can be assigned to events',
            accent: 'primary',
          },
          {
            label: 'Pending invites',
            value: loading ? '—' : pending.length,
            hint: 'Awaiting password setup',
            accent: 'warning',
          },
        ]}
      />

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">
            Active
            {!loading && organizers.length > 0 ? ` (${organizers.length})` : ''}
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending
            {!loading && pending.length > 0 ? ` (${pending.length})` : ''}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <LoadingRows />
              ) : pending.length === 0 ? (
                <OrganizerEmptyState
                  title="No pending invites"
                  description="Send an invite when you need to add another organiser."
                  actionLabel="Send invite"
                  onAction={openInvite}
                  tone="amber"
                />
              ) : (
                <ul className="space-y-2 p-4">
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <LoadingRows />
              ) : organizers.length === 0 ? (
                <OrganizerEmptyState
                  title="No organisers yet"
                  description="Invited people appear here after they accept and set a password."
                  actionLabel="Send invite"
                  onAction={openInvite}
                  tone="primary"
                />
              ) : (
                <ul className="space-y-2 p-4">
                  {organizers.map((org) => (
                    <ActiveOrganizerRow key={org.id} organizer={org} />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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

function OrganizerEmptyState({
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
