import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, GlassPanel, Skeleton } from '../../components/ui'
import {
  fetchOrganizerEvent,
  fetchOrganizerRegistrations,
  organizerEventsKeys,
  setRegistrationAttendance,
} from '../../lib/queries/organizerEvents'

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function OrganizerEventDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const eventQuery = useQuery({
    queryKey: organizerEventsKeys.detail(id),
    queryFn: () => fetchOrganizerEvent(id),
    enabled: Boolean(id),
  })

  const regsQuery = useQuery({
    queryKey: organizerEventsKeys.registrations(id),
    queryFn: () => fetchOrganizerRegistrations(id),
    enabled: Boolean(id),
  })

  const attendanceMutation = useMutation({
    mutationFn: ({
      registrationId,
      attended,
    }: {
      registrationId: string
      attended: boolean
    }) => setRegistrationAttendance(id, registrationId, attended),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: organizerEventsKeys.registrations(id),
      })
    },
  })

  const event = eventQuery.data
  const regs = regsQuery.data?.data ?? []
  const windowOpen =
    regsQuery.data?.attendanceWindowOpen ?? event?.attendanceWindowOpen ?? false
  const opensAt =
    regsQuery.data?.attendanceOpensAt ?? event?.attendanceOpensAt ?? null

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/organizer"
          className="text-sm font-semibold text-primary transition hover:text-primary-hover"
        >
          ← Back to my events
        </Link>
      </div>

      {eventQuery.isPending ? (
        <Skeleton className="h-28 w-full" />
      ) : eventQuery.isError || !event ? (
        <p className="rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-sm text-red-700">
          {eventQuery.error instanceof Error
            ? eventQuery.error.message
            : 'Event not found'}
        </p>
      ) : (
        <GlassPanel className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
                {event.name}
              </h1>
              <p className="mt-1 text-sm text-ink/55">
                {event.sport} · {event.venue}
              </p>
              <p className="mt-1 text-sm text-ink/55">
                Starts {formatWhen(event.startsAt)}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                windowOpen
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-ink/10 text-ink/60'
              }`}
            >
              {windowOpen
                ? 'Check-in open'
                : opensAt
                  ? `Opens ${formatWhen(opensAt)}`
                  : 'Attendance closed'}
            </span>
          </div>
        </GlassPanel>
      )}

      <GlassPanel className="overflow-hidden p-0">
        <div className="border-b border-line/70 px-6 py-4">
          <h2 className="text-lg font-semibold text-ink">Player attendance</h2>
          <p className="mt-1 text-sm text-ink/55">
            Single click to mark a player present. Click again to clear.
          </p>
          {!windowOpen ? (
            <p className="mt-2 text-sm font-medium text-amber-800">
              Attendance opens 30 minutes before the event starts
              {opensAt ? ` (${formatWhen(opensAt)})` : ''}.
            </p>
          ) : null}
        </div>

        {regsQuery.isPending ? (
          <div className="space-y-2 p-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : regsQuery.isError ? (
          <p className="p-6 text-sm text-red-700">
            {regsQuery.error instanceof Error
              ? regsQuery.error.message
              : 'Failed to load roster'}
          </p>
        ) : regs.length === 0 ? (
          <p className="p-6 text-sm text-ink/55">No confirmed players yet.</p>
        ) : (
          <ul className="divide-y divide-line/60">
            {regs.map((row) => {
              const present = Boolean(row.attendedAt)
              const busy =
                attendanceMutation.isPending &&
                attendanceMutation.variables?.registrationId === row.id
              return (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-6 py-3"
                >
                  <div>
                    <p className="font-semibold text-ink">
                      {row.user.firstName} {row.user.lastName}
                    </p>
                    <p className="text-xs text-ink/50">
                      @{row.user.username}
                      {present && row.attendedAt
                        ? ` · marked ${formatWhen(row.attendedAt)}`
                        : ''}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant={present ? 'primary' : 'secondary'}
                    disabled={!windowOpen || busy}
                    onClick={() =>
                      attendanceMutation.mutate({
                        registrationId: row.id,
                        attended: !present,
                      })
                    }
                  >
                    {busy ? 'Saving…' : present ? 'Present' : 'Mark present'}
                  </Button>
                </li>
              )
            })}
          </ul>
        )}

        {attendanceMutation.isError ? (
          <p className="border-t border-red-100 bg-red-50/80 px-6 py-3 text-sm text-red-700">
            {attendanceMutation.error instanceof Error
              ? attendanceMutation.error.message
              : 'Could not update attendance'}
          </p>
        ) : null}
      </GlassPanel>
    </div>
  )
}
