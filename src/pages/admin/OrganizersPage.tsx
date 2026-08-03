import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, FieldLabel, GlassPanel, TextInput } from '../../components/ui'
import { Modal } from '../../components/ui/Modal'
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
  const [modalOpen, setModalOpen] = useState(false)
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
      setSuccessMsg('Invite resent.')
      await queryClient.invalidateQueries({ queryKey: organizersKeys.list() })
    },
    onError: (err) => {
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

  const organizers = listQuery.data?.organizers ?? []
  const pending = listQuery.data?.pendingInvites ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
            Organisers
          </h1>
          <p className="mt-1.5 text-sm text-ink/55">
            Invite employees by email. They set a password from the invite link —
            there is no self-registration.
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

      <GlassPanel className="overflow-hidden p-0">
        <div className="border-b border-line/70 px-6 py-4">
          <h2 className="text-lg font-semibold text-ink">Pending invites</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm text-ink">
            <thead className="border-b border-line bg-accent/40 text-ink/80">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Expires</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {listQuery.isPending ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-ink/60"
                  >
                    Loading…
                  </td>
                </tr>
              ) : pending.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-ink/60"
                  >
                    No pending invites
                  </td>
                </tr>
              ) : (
                pending.map((invite) => (
                  <tr
                    key={invite.id}
                    className="border-b border-line/50 transition hover:bg-accent/25"
                  >
                    <td className="px-4 py-3 font-semibold">
                      {invite.firstName} {invite.lastName}
                    </td>
                    <td className="px-4 py-3 text-ink/80">{invite.email}</td>
                    <td className="px-4 py-3 text-ink/80">
                      {formatWhen(invite.expiresAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={resendMutation.isPending}
                        onClick={() => resendMutation.mutate(invite.id)}
                      >
                        Resend
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassPanel>

      <GlassPanel strong className="overflow-hidden">
        <div className="border-b border-line/70 px-6 py-4">
          <h2 className="text-lg font-semibold text-ink">Active organisers</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm text-ink">
            <thead className="border-b border-line bg-accent/40 text-ink/80">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Username</th>
                <th className="px-4 py-3 font-semibold">Assigned events</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody>
              {listQuery.isPending ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-ink/60"
                  >
                    Loading…
                  </td>
                </tr>
              ) : organizers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-ink/60"
                  >
                    No organisers yet
                  </td>
                </tr>
              ) : (
                organizers.map((org) => (
                  <tr
                    key={org.id}
                    className="border-b border-line/50 transition hover:bg-accent/25"
                  >
                    <td className="px-4 py-3 font-semibold">
                      {org.firstName} {org.lastName}
                    </td>
                    <td className="px-4 py-3 text-ink/80">
                      {org.email ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-ink/80">@{org.username}</td>
                    <td className="px-4 py-3 tabular-nums text-ink/80">
                      {org.assignedEventsCount}
                    </td>
                    <td className="px-4 py-3 text-ink/80">
                      {formatWhen(org.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassPanel>

      <Modal
        open={modalOpen}
        title="Send invite"
        onClose={() => {
          if (!inviteMutation.isPending) setModalOpen(false)
        }}
      >
        <form onSubmit={onInvite} className="space-y-4">
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
          <div>
            <FieldLabel>Email</FieldLabel>
            <TextInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
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
