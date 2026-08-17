import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { GlassPanel, Skeleton } from '../../components/ui'
import { resolveAssetUrl } from '../../lib/api'
import {
  fetchOrganizerEventHistory,
  organizerEventsKeys,
} from '../../lib/queries/organizerEvents'
import type { EventStatus, SportEvent } from '../../lib/types'

type ViewMode = 'card' | 'list'

const STATUS_STYLES: Record<EventStatus, string> = {
  DRAFT: 'bg-ink/10 text-ink/70',
  PUBLISHED: 'bg-emerald-100 text-emerald-800',
  COMPLETED: 'bg-sky-100 text-sky-800',
  CANCELLED: 'bg-red-100 text-red-700',
}

const STATUS_LABELS: Record<EventStatus, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function formatFee(fee: number) {
  if (fee === 0) return 'Free'
  return `₹${fee}`
}

function StatusBadge({ status }: { status: EventStatus }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
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

function EventDetails({ event }: { event: SportEvent }) {
  const location = [event.district, event.state].filter(Boolean).join(', ')
  const schools =
    event.schools.length > 0
      ? event.schools.map((s) => s.name).join(', ')
      : null

  return (
    <dl className="mt-3 grid gap-2 text-sm text-ink/55 sm:grid-cols-2">
      <div>
        <dt className="text-xs font-semibold uppercase tracking-wide text-ink/40">
          Date & time
        </dt>
        <dd className="mt-0.5 font-medium text-ink/70">
          {formatWhen(event.startsAt)}
          {event.endsAt ? ` – ${formatWhen(event.endsAt)}` : ''}
        </dd>
      </div>
      <div>
        <dt className="text-xs font-semibold uppercase tracking-wide text-ink/40">
          Registrations
        </dt>
        <dd className="mt-0.5 font-medium text-ink/70">
          {event.registeredCount}/{event.maxParticipants} players
        </dd>
      </div>
      <div>
        <dt className="text-xs font-semibold uppercase tracking-wide text-ink/40">
          Entry fee
        </dt>
        <dd className="mt-0.5 font-medium text-ink/70">{formatFee(event.fee)}</dd>
      </div>
      <div>
        <dt className="text-xs font-semibold uppercase tracking-wide text-ink/40">
          Age category
        </dt>
        <dd className="mt-0.5 font-medium text-ink/70">{event.ageCategory}</dd>
      </div>
      {location ? (
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink/40">
            Region
          </dt>
          <dd className="mt-0.5 font-medium text-ink/70">{location}</dd>
        </div>
      ) : null}
      {schools ? (
        <div className="sm:col-span-2">
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink/40">
            Schools
          </dt>
          <dd className="mt-0.5 font-medium text-ink/70">{schools}</dd>
        </div>
      ) : null}
      {event.description ? (
        <div className="sm:col-span-2">
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink/40">
            Description
          </dt>
          <dd className="mt-0.5 line-clamp-2 font-medium text-ink/70">
            {event.description}
          </dd>
        </div>
      ) : null}
    </dl>
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
      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap items-start gap-2">
          <h2 className="min-w-0 flex-1 text-base font-semibold text-ink">
            {event.name}
          </h2>
          <StatusBadge status={event.status} />
        </div>
        <p className="mt-1 text-sm text-ink/55">
          {event.sport} · {event.venue}
        </p>
        <EventDetails event={event} />
        <p className="mt-3 text-xs font-semibold text-primary">
          View full details →
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
            className="h-20 w-28 rounded-xl object-cover"
          />
        ) : (
          <div className="flex h-20 w-28 items-center justify-center rounded-xl bg-ink/5 text-xs font-semibold text-ink/40">
            {event.sport}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-ink">{event.name}</h2>
            <StatusBadge status={event.status} />
          </div>
          <p className="mt-1 text-sm text-ink/55">
            {event.sport} · {event.venue}
          </p>
          <EventDetails event={event} />
        </div>
      </div>
    </Link>
  )
}

export function OrganizerHistoryPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('card')
  const { data, isPending, isError, error } = useQuery({
    queryKey: organizerEventsKeys.history(),
    queryFn: fetchOrganizerEventHistory,
  })

  const events = data?.data ?? []
  const total = data?.meta.total ?? events.length
  const completedCount = events.filter((e) => e.status === 'COMPLETED').length
  const cancelledCount = events.filter((e) => e.status === 'CANCELLED').length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
            Event history
          </h1>
          <p className="mt-1.5 text-sm text-ink/55">
            Past events you have conducted. View full details including roster
            and match results.
          </p>
        </div>
        {!isPending && !isError && events.length > 0 ? (
          <ViewToggle value={viewMode} onChange={setViewMode} />
        ) : null}
      </div>

      {!isPending && !isError ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <GlassPanel className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{total}</p>
            <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-ink/45">
              Total events
            </p>
          </GlassPanel>
          <GlassPanel className="p-4 text-center">
            <p className="text-2xl font-bold text-sky-700">{completedCount}</p>
            <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-ink/45">
              Completed
            </p>
          </GlassPanel>
          <GlassPanel className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{cancelledCount}</p>
            <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-ink/45">
              Cancelled
            </p>
          </GlassPanel>
        </div>
      ) : null}

      {isPending ? (
        <div
          className={
            viewMode === 'card'
              ? 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3'
              : 'space-y-3'
          }
        >
          <Skeleton className={viewMode === 'card' ? 'h-80 w-full' : 'h-32 w-full'} />
          <Skeleton className={viewMode === 'card' ? 'h-80 w-full' : 'h-32 w-full'} />
          {viewMode === 'card' ? (
            <Skeleton className="h-80 w-full" />
          ) : null}
        </div>
      ) : isError ? (
        <p className="rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-sm text-red-700">
          {error instanceof Error ? error.message : 'Failed to load event history'}
        </p>
      ) : events.length === 0 ? (
        <GlassPanel className="p-8 text-center text-sm text-ink/55">
          No past events yet. Completed and cancelled events assigned to you will
          appear here.
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
