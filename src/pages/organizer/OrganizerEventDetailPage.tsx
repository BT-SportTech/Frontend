import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChessMatchmakingPanel } from '../../components/chess/ChessMatchmakingPanel'
import { GlassPanel, Skeleton, TextInput } from '../../components/ui'
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

function initials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
}

function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

type AttendanceFilter = 'all' | 'present' | 'absent'

export function OrganizerEventDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<AttendanceFilter>('all')
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set())
  const [showCheckIn, setShowCheckIn] = useState(true)

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

  function markPending(registrationId: string, pending: boolean) {
    setPendingIds((prev) => {
      const next = new Set(prev)
      if (pending) next.add(registrationId)
      else next.delete(registrationId)
      return next
    })
  }

  const attendanceMutation = useMutation({
    mutationFn: ({
      registrationId,
      attended,
    }: {
      registrationId: string
      attended: boolean
    }) => setRegistrationAttendance(id, registrationId, attended),
    onMutate: ({ registrationId }) => {
      markPending(registrationId, true)
    },
    onSettled: async (_data, _error, variables) => {
      markPending(variables.registrationId, false)
      await queryClient.invalidateQueries({
        queryKey: organizerEventsKeys.registrations(id),
      })
      await queryClient.invalidateQueries({
        queryKey: organizerEventsKeys.detail(id),
      })
      await queryClient.invalidateQueries({
        queryKey: ['chess-matchmaking'],
      })
    },
  })

  const event = eventQuery.data
  const regs = regsQuery.data?.data ?? []
  const isChess =
    event?.sport?.toLowerCase() === 'chess' ||
    event?.game?.name?.toLowerCase() === 'chess'
  const matchmakingStarted =
    event?.matchmakingStatus === 'IN_PROGRESS' ||
    event?.matchmakingStatus === 'COMPLETED'
  const windowOpen =
    regsQuery.data?.attendanceWindowOpen ?? event?.attendanceWindowOpen ?? false
  const opensAt =
    regsQuery.data?.attendanceOpensAt ?? event?.attendanceOpensAt ?? null

  const presentCount = regs.filter(
    (r) => r.attendedAt && !r.withdrawnAt,
  ).length
  const absentCount = regs.filter(
    (r) => !r.attendedAt && !r.withdrawnAt,
  ).length
  const withdrawnCount = regs.filter((r) => r.withdrawnAt).length

  const filteredRegs = useMemo(() => {
    const q = search.trim().toLowerCase()
    return regs.filter((row) => {
      if (filter === 'present' && !row.attendedAt) return false
      if (filter === 'absent' && row.attendedAt) return false
      if (!q) return true
      const name =
        `${row.user.firstName} ${row.user.lastName} ${row.user.username}`.toLowerCase()
      return name.includes(q)
    })
  }, [regs, search, filter])

  const step =
    !matchmakingStarted
      ? 1
      : event?.matchmakingStatus === 'COMPLETED'
        ? 3
        : 2

  return (
    <div className="space-y-5">
      <div>
        <Link
          to="/organizer"
          className="text-sm font-semibold text-primary transition hover:text-primary-hover"
        >
          ← My events
        </Link>
      </div>

      {eventQuery.isPending ? (
        <Skeleton className="h-28 w-full rounded-2xl" />
      ) : eventQuery.isError || !event ? (
        <p className="rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-sm text-red-700">
          {eventQuery.error instanceof Error
            ? eventQuery.error.message
            : 'Event not found'}
        </p>
      ) : (
        <GlassPanel className="overflow-hidden p-0">
          <div className="px-5 py-5 sm:px-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                  {event.name}
                </h1>
                <p className="mt-1 text-sm text-ink/55">
                  {event.sport} · {event.venue}
                </p>
                <p className="mt-0.5 text-sm text-ink/45">
                  {formatWhen(event.startsAt)}
                  {isChess && event.boardCount
                    ? ` · ${event.boardCount} boards per set · ${event.gamesPerPlayer ?? 3} games per player`
                    : ''}
                </p>
              </div>
              <span
                className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                  windowOpen
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-ink/8 text-ink/55'
                }`}
              >
                {windowOpen
                  ? 'Check-in open'
                  : opensAt
                    ? `Opens ${formatWhen(opensAt)}`
                    : 'Closed'}
              </span>
            </div>

            {isChess ? (
              <div className="mt-5 flex items-center gap-0 overflow-x-auto">
                {[
                  { n: 1, label: 'Check in' },
                  { n: 2, label: `${event.gamesPerPlayer ?? 3} games each` },
                  { n: 3, label: 'Done' },
                ].map((s, idx) => {
                  const active = step === s.n
                  const done = step > s.n
                  return (
                    <div key={s.n} className="flex items-center">
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                            done
                              ? 'bg-primary text-white'
                              : active
                                ? 'bg-primary text-white'
                                : 'bg-ink/8 text-ink/40'
                          }`}
                        >
                          {done ? '✓' : s.n}
                        </span>
                        <span
                          className={`whitespace-nowrap text-sm font-semibold ${
                            active || done ? 'text-ink' : 'text-ink/35'
                          }`}
                        >
                          {s.label}
                        </span>
                      </div>
                      {idx < 2 ? (
                        <div
                          className={`mx-3 h-px w-8 sm:w-12 ${
                            done ? 'bg-primary' : 'bg-ink/10'
                          }`}
                        />
                      ) : null}
                    </div>
                  )
                })}
              </div>
            ) : null}
          </div>
        </GlassPanel>
      )}

      {/* Attendance */}
      <GlassPanel className="overflow-hidden p-0">
        <button
          type="button"
          onClick={() => setShowCheckIn((v) => !v)}
          className="flex w-full items-start justify-between gap-3 px-5 py-4 text-left sm:px-6"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-semibold text-ink">Check-in</h2>
              <div className="flex flex-wrap gap-2 text-xs font-bold">
                <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-emerald-800">
                  {presentCount} present
                </span>
                <span className="rounded-lg bg-ink/8 px-2.5 py-1 text-ink/55">
                  {absentCount} not checked in
                </span>
                {withdrawnCount > 0 ? (
                  <span className="rounded-lg bg-red-100 px-2.5 py-1 text-red-700">
                    {withdrawnCount} withdrawn
                  </span>
                ) : null}
              </div>
            </div>
            <p className="mt-0.5 text-sm text-ink/50">
              Tap a player to mark them present
              {matchmakingStarted && isChess
                ? ' · Locked after pairing starts'
                : ''}
            </p>
          </div>
          <span className="shrink-0 pt-0.5 text-sm font-semibold text-primary">
            {showCheckIn ? 'Hide' : 'Show'}
          </span>
        </button>

        {showCheckIn ? (
          <>
            <div className="border-t border-line/60 px-5 pt-3 sm:px-6">
              {!windowOpen ? (
                <p className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
                  Check-in opens 30 minutes before start
                  {opensAt ? ` (${formatWhen(opensAt)})` : ''}.
                </p>
              ) : null}

              {regs.length > 4 ? (
                <div className="mb-3 flex flex-wrap gap-2">
                  <TextInput
                    placeholder="Search players…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-xs"
                  />
                  <div className="flex rounded-lg border border-line bg-white p-0.5">
                    {(
                      [
                        ['all', 'All players'],
                        ['present', 'Present'],
                        ['absent', 'Not checked in'],
                      ] as const
                    ).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFilter(key)}
                        className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                          filter === key
                            ? 'bg-primary text-white'
                            : 'text-ink/55 hover:text-ink'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {regsQuery.isPending ? (
              <div className="space-y-2 p-5">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : regsQuery.isError ? (
              <p className="p-5 text-sm text-red-700">
                {regsQuery.error instanceof Error
                  ? regsQuery.error.message
                  : 'Failed to load roster'}
              </p>
            ) : regs.length === 0 ? (
              <p className="p-6 text-sm text-ink/50">No players registered yet.</p>
            ) : filteredRegs.length === 0 ? (
              <p className="p-6 text-sm text-ink/50">
                No players match your filter.
              </p>
            ) : (
              <div className="grid gap-3 p-5 pt-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:px-6">
                {filteredRegs.map((row) => {
                  const present = Boolean(row.attendedAt)
                  const withdrawn = Boolean(row.withdrawnAt)
                  const busy = pendingIds.has(row.id)
                  const lockAttendance = isChess && matchmakingStarted
                  const canToggle =
                    windowOpen && !lockAttendance && !withdrawn

                  return (
                    <button
                      key={row.id}
                      type="button"
                      disabled={!canToggle || busy}
                      onClick={() => {
                        if (busy) return
                        attendanceMutation.mutate({
                          registrationId: row.id,
                          attended: !present,
                        })
                      }}
                      className={`flex flex-col rounded-2xl border p-4 text-left transition ${
                        canToggle && !busy
                          ? 'hover:border-primary/30 hover:bg-primary/[0.03] active:scale-[0.99]'
                          : 'cursor-default'
                      } ${
                        busy
                          ? 'border-primary/20 bg-primary/[0.04]'
                          : present && !withdrawn
                            ? 'border-emerald-200 bg-emerald-50/50'
                            : withdrawn
                              ? 'border-red-200/60 bg-red-50/30'
                              : 'border-line/60 bg-white/80'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                            busy
                              ? 'bg-primary/15 text-primary'
                              : withdrawn
                                ? 'bg-red-100 text-red-700'
                                : present
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-ink/8 text-ink/45'
                          }`}
                        >
                          {busy ? (
                            <Spinner className="h-5 w-5" />
                          ) : present && !withdrawn ? (
                            '✓'
                          ) : (
                            initials(row.user.firstName, row.user.lastName)
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold leading-tight text-ink">
                            {row.user.firstName} {row.user.lastName}
                          </p>
                          <p className="mt-0.5 text-xs text-ink/45">
                            @{row.user.username}
                          </p>
                          {typeof row.chessRating === 'number' ? (
                            <p className="mt-1 text-xs font-semibold text-ink/55">
                              Rating {row.chessRating}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <span
                        className={`mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-bold ${
                          busy
                            ? 'bg-primary/10 text-primary'
                            : withdrawn
                              ? 'bg-red-100 text-red-700'
                              : present
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-ink/8 text-ink/45'
                        }`}
                      >
                        {busy ? (
                          <>
                            <Spinner className="h-3.5 w-3.5" />
                            {present ? 'Updating…' : 'Checking in…'}
                          </>
                        ) : withdrawn ? (
                          'Withdrawn'
                        ) : present ? (
                          'Present'
                        ) : (
                          'Tap to check in'
                        )}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}

            {attendanceMutation.isError ? (
              <p className="border-t border-red-100 bg-red-50/80 px-5 py-3 text-sm text-red-700">
                {attendanceMutation.error instanceof Error
                  ? attendanceMutation.error.message
                  : 'Could not update attendance'}
              </p>
            ) : null}
          </>
        ) : null}
      </GlassPanel>

      {event && isChess ? (
        <ChessMatchmakingPanel event={event} presentCount={presentCount} />
      ) : null}
    </div>
  )
}
