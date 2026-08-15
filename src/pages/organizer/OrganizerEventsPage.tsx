import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { GlassPanel, Skeleton } from '../../components/ui'
import { resolveAssetUrl } from '../../lib/api'
import {
  fetchOrganizerEvents,
  organizerEventsKeys,
} from '../../lib/queries/organizerEvents'
import type { SportEvent } from '../../lib/types'

type ViewMode = 'card' | 'list'

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

function AttendanceBadge({ event }: { event: SportEvent }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        event.attendanceWindowOpen
          ? 'bg-emerald-100 text-emerald-800'
          : 'bg-ink/10 text-ink/60'
      }`}
    >
      {attendanceLabel(event)}
    </span>
  )
}

function ViewToggle({
  value,
  onChange,
}: {
  value: ViewMode
  onChange: (mode: ViewMode) => void
}) {
  return (
    <div
      className="inline-flex rounded-lg border border-line bg-white p-0.5"
      role="group"
      aria-label="Event layout"
    >
      <button
        type="button"
        title="Card view"
        aria-label="Card view"
        aria-pressed={value === 'card'}
        onClick={() => onChange('card')}
        className={`inline-flex h-9 w-9 items-center justify-center rounded-md transition ${
          value === 'card'
            ? 'bg-primary text-white'
            : 'text-ink/55 hover:bg-ink/5 hover:text-ink'
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden
        >
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      </button>
      <button
        type="button"
        title="List view"
        aria-label="List view"
        aria-pressed={value === 'list'}
        onClick={() => onChange('list')}
        className={`inline-flex h-9 w-9 items-center justify-center rounded-md transition ${
          value === 'list'
            ? 'bg-primary text-white'
            : 'text-ink/55 hover:bg-ink/5 hover:text-ink'
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden
        >
          <line x1="8" x2="21" y1="6" y2="6" />
          <line x1="8" x2="21" y1="12" y2="12" />
          <line x1="8" x2="21" y1="18" y2="18" />
          <line x1="3" x2="3.01" y1="6" y2="6" />
          <line x1="3" x2="3.01" y1="12" y2="12" />
          <line x1="3" x2="3.01" y1="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}

function EventCard({ event }: { event: SportEvent }) {
  return (
    <Link
      to={`/organizer/events/${event.id}`}
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition hover:border-primary/30"
    >
      {event.imageUrl ? (
        <img
          src={resolveAssetUrl(event.imageUrl)}
          alt=""
          className="h-40 w-full object-cover"
        />
      ) : (
        <div className="flex h-40 w-full items-center justify-center bg-ink/5 text-sm font-semibold text-ink/40">
          {event.sport}
        </div>
      )}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap items-start gap-2">
          <h2 className="min-w-0 flex-1 text-base font-semibold text-ink">
            {event.name}
          </h2>
          <AttendanceBadge event={event} />
        </div>
        <p className="text-sm text-ink/55">
          {event.sport} · {event.venue}
        </p>
        <p className="mt-auto text-sm text-ink/55">
          Starts {formatWhen(event.startsAt)} · {event.registeredCount}/
          {event.maxParticipants} registered
        </p>
      </div>
    </Link>
  )
}

function EventListItem({ event }: { event: SportEvent }) {
  return (
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
            <h2 className="text-lg font-semibold text-ink">{event.name}</h2>
            <AttendanceBadge event={event} />
          </div>
          <p className="mt-1 text-sm text-ink/55">
            {event.sport} · {event.venue}
          </p>
          <p className="mt-1 text-sm text-ink/55">
            Starts {formatWhen(event.startsAt)} · {event.registeredCount}/
            {event.maxParticipants} registered
          </p>
        </div>
      </div>
    </Link>
  )
}

export function OrganizerEventsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('card')
  const { data, isPending, isError, error } = useQuery({
    queryKey: organizerEventsKeys.mine(),
    queryFn: fetchOrganizerEvents,
  })

  const events = data?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
            My events
          </h1>
          <p className="mt-1.5 text-sm text-ink/55">
            Upcoming published events assigned to you. Attendance opens 30
            minutes before kickoff.
          </p>
        </div>
        {!isPending && !isError && events.length > 0 ? (
          <ViewToggle value={viewMode} onChange={setViewMode} />
        ) : null}
      </div>

      {isPending ? (
        <div
          className={
            viewMode === 'card'
              ? 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3'
              : 'space-y-3'
          }
        >
          <Skeleton className={viewMode === 'card' ? 'h-64 w-full' : 'h-24 w-full'} />
          <Skeleton className={viewMode === 'card' ? 'h-64 w-full' : 'h-24 w-full'} />
          {viewMode === 'card' ? (
            <Skeleton className="h-64 w-full" />
          ) : null}
        </div>
      ) : isError ? (
        <p className="rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-sm text-red-700">
          {error instanceof Error ? error.message : 'Failed to load events'}
        </p>
      ) : events.length === 0 ? (
        <GlassPanel className="p-8 text-center text-sm text-ink/55">
          No published events assigned to you yet.
        </GlassPanel>
      ) : viewMode === 'card' ? (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {events.map((event) => (
            <li key={event.id}>
              <EventCard event={event} />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="space-y-3">
          {events.map((event) => (
            <li key={event.id}>
              <EventListItem event={event} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
