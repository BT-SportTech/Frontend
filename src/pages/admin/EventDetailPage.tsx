import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { GlassPanel, Skeleton } from '../../components/ui'
import { resolveAssetUrl } from '../../lib/api'
import {
  eventsKeys,
  fetchEvent,
  fetchEventRegistrations,
} from '../../lib/queries/events'
import type { EventStatus } from '../../lib/types'

const STATUS_STYLES: Record<EventStatus, string> = {
  DRAFT: 'bg-ink/10 text-ink/70',
  PUBLISHED: 'bg-emerald-100 text-emerald-800',
  COMPLETED: 'bg-sky-100 text-sky-800',
  CANCELLED: 'bg-red-100 text-red-700',
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function EventDetailPage() {
  const { id = '' } = useParams<{ id: string }>()

  const {
    data: event,
    isPending: eventPending,
    isError: eventError,
    error: eventErr,
  } = useQuery({
    queryKey: eventsKeys.detail(id),
    queryFn: () => fetchEvent(id),
    enabled: Boolean(id),
  })

  const {
    data: regsData,
    isPending: regsPending,
    isError: regsError,
    error: regsErr,
  } = useQuery({
    queryKey: [...eventsKeys.detail(id), 'registrations'] as const,
    queryFn: () => fetchEventRegistrations(id),
    enabled: Boolean(id),
  })

  const registrations = regsData?.data ?? []
  const registeredCount = event?.registeredCount ?? registrations.length
  const maxParticipants = event?.maxParticipants ?? 0
  const seatsLeft =
    event?.seatsLeft ?? Math.max(0, maxParticipants - registeredCount)
  const fillPct =
    maxParticipants > 0
      ? Math.min(100, Math.round((registeredCount / maxParticipants) * 100))
      : 0

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/admin/events"
          className="text-sm font-semibold text-primary transition hover:text-primary-hover"
        >
          ← Back to events
        </Link>
      </div>

      {eventPending ? (
        <EventDetailSkeleton />
      ) : eventError || !event ? (
        <p className="rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-sm text-red-700">
          {eventErr instanceof Error ? eventErr.message : 'Event not found'}
        </p>
      ) : (
        <>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
                {event.name}
              </h1>
              <span
                className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[event.status]}`}
              >
                {event.status}
              </span>
            </div>
            <p className="mt-1.5 text-sm text-ink/55">
              {event.sport}
              {event.ageCategory ? ` · ${event.ageCategory}` : ''} ·{' '}
              {event.venue}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Registered" value={String(registeredCount)} />
            <StatCard label="Capacity" value={String(maxParticipants)} />
            <StatCard label="Seats left" value={String(seatsLeft)} />
            <StatCard label="Filled" value={`${fillPct}%`} />
          </div>

          <GlassPanel strong className="overflow-hidden">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-stretch">
              {event.imageUrl ? (
                <img
                  src={resolveAssetUrl(event.imageUrl)}
                  alt=""
                  className="h-40 w-full shrink-0 object-cover sm:h-auto sm:w-56"
                />
              ) : (
                <div className="flex h-40 w-full shrink-0 items-center justify-center bg-accent/40 text-sm text-ink/40 sm:h-auto sm:w-56">
                  No banner
                </div>
              )}
              <div className="min-w-0 flex-1 p-5 sm:py-6 sm:pr-6 sm:pl-0">
                <h2 className="font-display text-lg font-bold text-ink">
                  Event details
                </h2>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-ink/45">
                      Venue
                    </dt>
                    <dd className="mt-0.5 font-medium text-ink">{event.venue}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-ink/45">
                      Starts
                    </dt>
                    <dd className="mt-0.5 font-medium text-ink">
                      {formatWhen(event.startsAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-ink/45">
                      Zone
                    </dt>
                    <dd className="mt-0.5 font-medium text-ink">
                      {event.state?.trim() && event.district?.trim()
                        ? `${event.district}, ${event.state}`
                        : 'Nationwide'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-ink/45">
                      Registration window
                    </dt>
                    <dd className="mt-0.5 font-medium text-ink">
                      {formatWhen(event.registrationOpensAt)} –{' '}
                      {formatWhen(event.registrationClosesAt)}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-ink/45">
                      Organisers
                    </dt>
                    <dd className="mt-0.5 font-medium text-ink">
                      {event.organizers && event.organizers.length > 0
                        ? event.organizers
                            .map(
                              (o) =>
                                `${o.firstName} ${o.lastName}`.trim() ||
                                o.username,
                            )
                            .join(', ')
                        : 'None assigned'}
                    </dd>
                  </div>
                </dl>
                {event.description ? (
                  <p className="mt-4 text-sm leading-relaxed text-ink/70">
                    {event.description}
                  </p>
                ) : null}
              </div>
            </div>
          </GlassPanel>

          <GlassPanel strong className="p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold text-ink">
                  Registered players
                </h2>
                <p className="mt-1 text-sm text-ink/55">
                  Players who confirmed registration for this event
                </p>
              </div>
              {regsPending ? (
                <Skeleton className="h-5 w-16" />
              ) : (
                <p className="text-sm font-semibold tabular-nums text-ink/70">
                  {registeredCount} / {maxParticipants}
                </p>
              )}
            </div>

            {regsPending ? (
              <PlayersTableSkeleton />
            ) : regsError ? (
              <p className="mt-6 rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-sm text-red-700">
                {regsErr instanceof Error
                  ? regsErr.message
                  : 'Failed to load registrations'}
              </p>
            ) : registrations.length === 0 ? (
              <p className="mt-6 text-sm text-ink/55">
                No players have registered for this event yet.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm text-ink">
                  <thead className="border-b border-line bg-accent/40 text-ink/80">
                    <tr>
                      <th className="px-3 py-2.5 font-semibold">#</th>
                      <th className="px-3 py-2.5 font-semibold">Player</th>
                      <th className="px-3 py-2.5 font-semibold">Username</th>
                      <th className="px-3 py-2.5 font-semibold">Email</th>
                      <th className="px-3 py-2.5 font-semibold">Attendance</th>
                      <th className="px-3 py-2.5 font-semibold">Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((row, index) => {
                      const fullName =
                        `${row.user.firstName} ${row.user.lastName}`.trim() ||
                        row.user.username
                      return (
                        <tr key={row.id} className="border-b border-line/50">
                          <td className="px-3 py-2.5 tabular-nums text-ink/50">
                            {index + 1}
                          </td>
                          <td className="px-3 py-2.5 font-semibold">
                            {fullName}
                          </td>
                          <td className="px-3 py-2.5 text-ink/80">
                            @{row.user.username}
                          </td>
                          <td className="px-3 py-2.5 text-ink/80">
                            {row.user.email ?? '—'}
                          </td>
                          <td className="px-3 py-2.5 text-ink/80">
                            {row.attendedAt ? (
                              <span className="font-semibold text-emerald-700">
                                Present
                              </span>
                            ) : (
                              <span className="text-ink/45">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-ink/80">
                            {formatWhen(row.registeredAt)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </GlassPanel>
        </>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <GlassPanel strong className="relative overflow-hidden p-5">
      <div className="absolute inset-y-0 left-0 w-1 bg-primary" />
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl font-bold tabular-nums text-ink">
        {value}
      </p>
    </GlassPanel>
  )
}

function EventDetailSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading event">
      <div>
        <Skeleton className="h-9 w-64 max-w-full" />
        <Skeleton className="mt-2 h-4 w-48 max-w-full" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <GlassPanel key={i} strong className="relative overflow-hidden p-5">
            <div className="absolute inset-y-0 left-0 w-1 bg-ink/10" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-8 w-16" />
          </GlassPanel>
        ))}
      </div>

      <GlassPanel strong className="overflow-hidden">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-stretch">
          <Skeleton className="h-40 w-full shrink-0 rounded-none sm:h-auto sm:min-h-[10rem] sm:w-56" />
          <div className="min-w-0 flex-1 space-y-4 p-5 sm:py-6 sm:pr-6 sm:pl-0">
            <Skeleton className="h-5 w-32" />
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-28" />
                </div>
              ))}
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </GlassPanel>

      <GlassPanel strong className="p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
        <PlayersTableSkeleton />
      </GlassPanel>
    </div>
  )
}

function PlayersTableSkeleton() {
  return (
    <div className="mt-4 space-y-3" aria-hidden>
      <div className="flex gap-3 border-b border-line pb-2.5">
        <Skeleton className="h-4 w-6" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="h-4 w-28" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-1">
          <Skeleton className="h-4 w-6" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-28" />
        </div>
      ))}
    </div>
  )
}
