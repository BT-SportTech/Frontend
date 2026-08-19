import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { GlassPanel, Skeleton } from '../../components/ui'
import { PageHeader } from '@/components/layout/PageHeader'
import { resolveAssetUrl } from '../../lib/api'
import {
  fetchOrganizerEvents,
  organizerEventsKeys,
  type OrganizerEventSummary,
} from '../../lib/queries/organizerEvents'

type ViewMode = 'cards' | 'list'

const VIEW_MODE_KEY = 'sporttech_organizer_events_view'

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function attendanceLabel(event: OrganizerEventSummary) {
  if (event.attendanceWindowOpen) return 'Check-in open'
  if (event.attendanceOpensAt) {
    return `Opens ${formatWhen(event.attendanceOpensAt)}`
  }
  return 'Attendance soon'
}

function EventStatusBadge({ event }: { event: OrganizerEventSummary }) {
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

function EventThumbnail({ event }: { event: OrganizerEventSummary }) {
  if (event.imageUrl) {
    return (
      <img
        src={resolveAssetUrl(event.imageUrl)}
        alt=""
        className="h-full w-full object-cover"
      />
    )
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-ink/5 text-sm font-semibold text-ink/40">
      {event.sport ?? 'Event'}
    </div>
  )
}

function EventCard({ event }: { event: OrganizerEventSummary }) {
  return (
    <Link
      to={`/organizer/events/${event.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/70 bg-white/55 shadow-sm transition hover:border-primary/30 hover:bg-white/80 hover:shadow-md"
    >
      <div className="aspect-[16/10] w-full overflow-hidden border-b border-line/40">
        <EventThumbnail event={event} />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 className="text-lg font-semibold leading-tight text-ink group-hover:text-primary">
            {event.name}
          </h2>
          <EventStatusBadge event={event} />
        </div>
        <p className="mt-2 text-sm text-ink/55">
          {event.sport ?? 'Event'} · {event.venue}
        </p>
        <p className="mt-auto pt-3 text-sm text-ink/55">
          Starts {formatWhen(event.startsAt)}
        </p>
      </div>
    </Link>
  )
}

function EventListRow({ event }: { event: OrganizerEventSummary }) {
  return (
    <Link
      to={`/organizer/events/${event.id}`}
      className="block rounded-2xl border border-white/70 bg-white/55 p-5 shadow-sm transition hover:border-primary/30 hover:bg-white/80"
    >
      <div className="flex flex-wrap items-start gap-4">
        <div className="h-16 w-24 shrink-0 overflow-hidden rounded-xl">
          <EventThumbnail event={event} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-ink">{event.name}</h2>
            <EventStatusBadge event={event} />
          </div>
          <p className="mt-1 text-sm text-ink/55">
            {event.sport ?? 'Event'} · {event.venue}
          </p>
          <p className="mt-1 text-sm text-ink/55">
            Starts {formatWhen(event.startsAt)}
          </p>
        </div>
      </div>
    </Link>
  )
}

function ViewModeToggle({
  viewMode,
  onChange,
}: {
  viewMode: ViewMode
  onChange: (mode: ViewMode) => void
}) {
  return (
    <div
      className="inline-flex w-full rounded-xl border border-line/70 bg-white/60 p-1 sm:w-auto"
      role="group"
      aria-label="Event display mode"
    >
      <button
        type="button"
        onClick={() => onChange('cards')}
        aria-pressed={viewMode === 'cards'}
        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
          viewMode === 'cards'
            ? 'bg-primary text-white shadow-sm'
            : 'text-ink/60 hover:bg-white hover:text-ink'
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
          <rect width="7" height="7" x="3" y="3" rx="1" />
          <rect width="7" height="7" x="14" y="3" rx="1" />
          <rect width="7" height="7" x="3" y="14" rx="1" />
          <rect width="7" height="7" x="14" y="14" rx="1" />
        </svg>
        Cards
      </button>
      <button
        type="button"
        onClick={() => onChange('list')}
        aria-pressed={viewMode === 'list'}
        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
          viewMode === 'list'
            ? 'bg-primary text-white shadow-sm'
            : 'text-ink/60 hover:bg-white hover:text-ink'
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
        List
      </button>
    </div>
  )
}

export function OrganizerEventsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      const stored = localStorage.getItem(VIEW_MODE_KEY)
      return stored === 'list' ? 'list' : 'cards'
    } catch {
      return 'cards'
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(VIEW_MODE_KEY, viewMode)
    } catch {
      /* ignore */
    }
  }, [viewMode])

  const { data, isPending, isError, error } = useQuery({
    queryKey: organizerEventsKeys.mine(),
    queryFn: fetchOrganizerEvents,
  })

  const events = data?.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="My events"
        description="Events assigned to you. Open an event when check-in is open."
        actions={
          !isPending && !isError && events.length > 0 ? (
            <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
          ) : null
        }
      />

      {isPending ? (
        viewMode === 'cards' ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        ) : (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )
      ) : isError ? (
        <p className="rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-sm text-red-700">
          {error instanceof Error ? error.message : 'Failed to load events'}
        </p>
      ) : events.length === 0 ? (
        <GlassPanel className="p-8 text-center text-sm text-ink/55">
          No published events assigned to you yet.
        </GlassPanel>
      ) : viewMode === 'cards' ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <ul className="space-y-3">
          {events.map((event) => (
            <li key={event.id}>
              <EventListRow event={event} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
