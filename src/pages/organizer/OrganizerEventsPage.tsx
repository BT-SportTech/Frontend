import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { GlassPanel, Skeleton } from '../../components/ui'
import { resolveAssetUrl } from '../../lib/api'
import {
  fetchOrganizerEvents,
  organizerEventsKeys,
} from '../../lib/queries/organizerEvents'
import type { SportEvent } from '../../lib/types'

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function attendanceLabel(event: SportEvent) {
  if (event.attendanceWindowOpen) return 'Check-in open'
  if (event.attendanceOpensAt) {
    return `Opens ${formatWhen(event.attendanceOpensAt)}`
  }
  return 'Attendance soon'
}

export function OrganizerEventsPage() {
  const { data, isPending, isError, error } = useQuery({
    queryKey: organizerEventsKeys.mine(),
    queryFn: fetchOrganizerEvents,
  })

  const events = data?.data ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
          My events
        </h1>
        <p className="mt-1.5 text-sm text-ink/55">
          Upcoming published events assigned to you. Attendance opens 30 minutes
          before kickoff.
        </p>
      </div>

      {isPending ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : isError ? (
        <p className="rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-sm text-red-700">
          {error instanceof Error ? error.message : 'Failed to load events'}
        </p>
      ) : events.length === 0 ? (
        <GlassPanel className="p-8 text-center text-sm text-ink/55">
          No published events assigned to you yet.
        </GlassPanel>
      ) : (
        <ul className="space-y-3">
          {events.map((event) => (
            <li key={event.id}>
              <Link
                to={`/organizer/events/${event.id}`}
                className="block rounded-2xl border border-line bg-white p-5 shadow-sm transition hover:border-primary/30"
              >
                <div className="flex flex-wrap items-start gap-4">
                  {event.imageUrl ? (
                    <img
                      src={resolveAssetUrl(event.imageUrl)}
                      alt=""
                      className="h-16 w-24 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-24 items-center justify-center rounded-xl bg-ink/5 text-xs font-semibold text-ink/40">
                      {event.sport}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-ink">
                        {event.name}
                      </h2>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          event.attendanceWindowOpen
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-ink/10 text-ink/60'
                        }`}
                      >
                        {attendanceLabel(event)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-ink/55">
                      {event.sport} · {event.venue}
                    </p>
                    <p className="mt-1 text-sm text-ink/55">
                      Starts {formatWhen(event.startsAt)} ·{' '}
                      {event.registeredCount}/{event.maxParticipants} registered
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
