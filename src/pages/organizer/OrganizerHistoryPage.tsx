import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { GlassPanel, Skeleton } from '../../components/ui'
import { resolveAssetUrl } from '../../lib/api'
import {
  fetchOrganizerHistory,
  organizerEventsKeys,
  type OrganizerEventSummary,
} from '../../lib/queries/organizerEvents'

type ViewMode = 'cards' | 'list'

const VIEW_MODE_KEY = 'sporttech_organizer_history_view'

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function formatLocation(event: OrganizerEventSummary) {
  const parts = [event.state, event.district].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : null
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

function HistoryDetails({ event }: { event: OrganizerEventSummary }) {
  const location = formatLocation(event)

  return (
    <dl className="mt-3 space-y-2 text-sm text-ink/55">
      {location ? (
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink/40">
            Location
          </dt>
          <dd className="mt-0.5 font-medium text-ink/70">{location}</dd>
        </div>
      ) : null}
      <div>
        <dt className="text-xs font-semibold uppercase tracking-wide text-ink/40">
          Venue
        </dt>
        <dd className="mt-0.5 font-medium text-ink/70">{event.venue}</dd>
      </div>
      <div>
        <dt className="text-xs font-semibold uppercase tracking-wide text-ink/40">
          Start time
        </dt>
        <dd className="mt-0.5 font-medium text-ink/70">
          {formatWhen(event.startsAt)}
        </dd>
      </div>
    </dl>
  )
}

function HistoryCard({ event }: { event: OrganizerEventSummary }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/70 bg-white/55 shadow-sm">
      <div className="aspect-[16/10] w-full overflow-hidden border-b border-line/40">
        <EventThumbnail event={event} />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h2 className="text-lg font-semibold leading-tight text-ink">
          {event.name}
        </h2>
        <HistoryDetails event={event} />
      </div>
    </div>
  )
}

function HistoryListRow({ event }: { event: OrganizerEventSummary }) {
  const location = formatLocation(event)

  return (
    <div className="rounded-2xl border border-white/70 bg-white/55 p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-ink">{event.name}</h2>
      <dl className="mt-3 grid grid-cols-1 gap-2 text-sm text-ink/55 sm:grid-cols-2 md:grid-cols-3">
        {location ? (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink/40">
              Location
            </dt>
            <dd className="mt-0.5 font-medium text-ink/70">{location}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink/40">
            Venue
          </dt>
          <dd className="mt-0.5 font-medium text-ink/70">{event.venue}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink/40">
            Start time
          </dt>
          <dd className="mt-0.5 font-medium text-ink/70">
            {formatWhen(event.startsAt)}
          </dd>
        </div>
      </dl>
    </div>
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
      className="inline-flex rounded-xl border border-line/70 bg-white/60 p-1"
      role="group"
      aria-label="History display mode"
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
        List
      </button>
    </div>
  )
}

export function OrganizerHistoryPage() {
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
    queryKey: organizerEventsKeys.history(),
    queryFn: fetchOrganizerHistory,
  })

  const events = data?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            to="/organizer"
            className="text-sm font-semibold text-primary transition hover:text-primary-hover"
          >
            ← Back to my events
          </Link>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink">
            Event history
          </h1>
          <p className="mt-1.5 text-sm text-ink/55">
            Past events you helped with. Basic details only.
          </p>
        </div>
        {!isPending && !isError && events.length > 0 ? (
          <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
        ) : null}
      </div>

      {isPending ? (
        viewMode === 'cards' ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        ) : (
          <div className="space-y-3">
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-28 w-full rounded-2xl" />
          </div>
        )
      ) : isError ? (
        <p className="rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-sm text-red-700">
          {error instanceof Error ? error.message : 'Failed to load history'}
        </p>
      ) : events.length === 0 ? (
        <GlassPanel className="p-8 text-center text-sm text-ink/55">
          No past events yet.
        </GlassPanel>
      ) : viewMode === 'cards' ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {events.map((event) => (
            <HistoryCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <ul className="space-y-3">
          {events.map((event) => (
            <li key={event.id}>
              <HistoryListRow event={event} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
