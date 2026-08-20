import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { ChessMatchmakingPanel } from '../../components/chess/ChessMatchmakingPanel'
import { PageHeader } from '@/components/layout/PageHeader'
import { FilterBar } from '@/components/layout/FilterBar'
import { StatGrid } from '@/components/layout/StatGrid'
import { EmptyState } from '@/components/layout/EmptyState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Stepper } from '@/components/ui/Stepper'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import {
  fetchOrganizerEvent,
  fetchOrganizerRegistrations,
  organizerEventsKeys,
  setRegistrationAttendance,
} from '../../lib/queries/organizerEvents'
import { displayName } from '../../lib/displayName'
import { formatUniqueCode } from '../../lib/uniqueCode'
import { toast } from '@/stores/useToastStore'

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function initials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
}

type AttendanceFilter = 'all' | 'present' | 'absent'
type MainTab = 'checkin' | 'matchmaking'

const FILTER_OPTIONS: { key: AttendanceFilter; label: string }[] = [
  { key: 'all', label: 'All players' },
  { key: 'present', label: 'Present' },
  { key: 'absent', label: 'Not checked in' },
]

function ChessWorkflowStepper({
  gamesPerPlayer,
  currentStep,
}: {
  gamesPerPlayer: number
  currentStep: number
}) {
  const steps = [
    { id: 'checkin', label: 'Check in' },
    { id: 'games', label: `${gamesPerPlayer} games each` },
    { id: 'done', label: 'Done' },
  ]

  return (
    <Card>
      <CardContent className="p-5 sm:p-6">
        <Stepper steps={steps} currentStep={currentStep} />
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
          {steps.map((step, index) => (
            <span
              key={step.id}
              className={cn(
                'font-semibold',
                index <= currentStep ? 'text-ink' : 'text-muted-foreground',
              )}
            >
              {step.label}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function OrganizerEventDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<AttendanceFilter>('all')
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set())
  const [mainTab, setMainTab] = useState<MainTab>('checkin')
  const [tabSeeded, setTabSeeded] = useState(false)
  const beganAsPastEventRef = useRef<boolean | null>(null)

  const eventQuery = useQuery({
    queryKey: organizerEventsKeys.detail(id),
    queryFn: () => fetchOrganizerEvent(id),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      const data = query.state.data
      if (!data || data.attendanceWindowOpen) return false
      return 30_000
    },
  })

  const event = eventQuery.data
  const isPastEvent =
    event?.status === 'COMPLETED' || event?.status === 'CANCELLED'

  useEffect(() => {
    if (!event || beganAsPastEventRef.current !== null) return
    beganAsPastEventRef.current = isPastEvent
  }, [event, isPastEvent])

  const isChess =
    event?.sport?.toLowerCase() === 'chess' ||
    event?.game?.name?.toLowerCase() === 'chess'
  const matchmakingStarted =
    event?.matchmakingStatus === 'IN_PROGRESS' ||
    event?.matchmakingStatus === 'COMPLETED'
  const windowOpenFromEvent = event?.attendanceWindowOpen ?? false
  const opensAtFromEvent = event?.attendanceOpensAt ?? null
  const canLoadRegs = windowOpenFromEvent

  const regsQuery = useQuery({
    queryKey: organizerEventsKeys.registrations(id),
    queryFn: () => fetchOrganizerRegistrations(id),
    enabled: Boolean(id) && canLoadRegs,
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
    onSuccess: (_data, variables) => {
      toast.success(variables.attended ? 'Marked present' : 'Marked absent')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Could not update attendance')
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

  const regs = canLoadRegs ? (regsQuery.data?.data ?? []) : []
  const windowOpen =
    regsQuery.data?.attendanceWindowOpen ?? windowOpenFromEvent
  const opensAt = regsQuery.data?.attendanceOpensAt ?? opensAtFromEvent

  const presentCount = regs.filter(
    (r) => r.attendedAt && !r.withdrawnAt,
  ).length
  const absentCount = regs.filter(
    (r) => !r.attendedAt && !r.withdrawnAt,
  ).length
  const withdrawnCount = regs.filter((r) => r.withdrawnAt).length

  useEffect(() => {
    if (!event || tabSeeded) return
    if (isChess && matchmakingStarted) setMainTab('matchmaking')
    setTabSeeded(true)
  }, [event, isChess, matchmakingStarted, tabSeeded])

  const filteredRegs = useMemo(() => {
    const q = search.trim().toLowerCase()
    return regs.filter((row) => {
      if (filter === 'present' && !row.attendedAt) return false
      if (filter === 'absent' && row.attendedAt) return false
      if (!q) return true
      const name =
        `${displayName(row.user.firstName, row.user.lastName)} ${row.user.username ?? ''}`.toLowerCase()
      return name.includes(q)
    })
  }, [regs, search, filter])

  const workflowStep = !matchmakingStarted
    ? 0
    : event?.matchmakingStatus === 'COMPLETED'
      ? 2
      : 1

  const rosterTotal = presentCount + absentCount
  const checkinTabLabel =
    rosterTotal > 0 ? `Check-in ${presentCount}/${rosterTotal}` : 'Check-in'

  const matchmakingTabLabel =
    event?.matchmakingStatus === 'COMPLETED'
      ? 'Matchmaking · Done'
      : event?.matchmakingStatus === 'IN_PROGRESS'
        ? 'Matchmaking · Live'
        : 'Matchmaking'

  const eventDescription = event
    ? [
        event.sport,
        event.venue,
        formatWhen(event.startsAt),
        isChess && event.boardCount
          ? `${event.boardCount} boards per set · ${event.gamesPerPlayer ?? 3} games per player`
          : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : ''

  const attendanceBadge = windowOpen
    ? { variant: 'success' as const, label: 'Check-in open' }
    : opensAt
      ? { variant: 'warning' as const, label: `Opens ${formatWhen(opensAt)}` }
      : { variant: 'outline' as const, label: 'Closed' }

  if (event && isPastEvent && beganAsPastEventRef.current === true) {
    return <Navigate to="/organizer/history" replace />
  }

  const checkInPanel = (
    <Card>
      <CardHeader className="border-b border-line pb-4">
        <CardTitle>Check-in</CardTitle>
        <CardDescription>
          Tap a player to mark them present
          {matchmakingStarted && isChess
            ? ' · Locked after pairing starts'
            : ''}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-5">
        {!windowOpen ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Check-in opens 30 minutes before start
            {opensAt ? ` (${formatWhen(opensAt)})` : ''}.
          </p>
        ) : null}

        {canLoadRegs ? (
          <StatGrid
            items={[
              { label: 'Present', value: presentCount, accent: 'primary' },
              { label: 'Not checked in', value: absentCount, accent: 'secondary' },
              ...(withdrawnCount > 0
                ? [
                    {
                      label: 'Withdrawn',
                      value: withdrawnCount,
                      accent: 'warning' as const,
                    },
                  ]
                : []),
            ]}
          />
        ) : null}

        {canLoadRegs && regs.length > 4 ? (
          <FilterBar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search players…"
          >
            <div className="flex rounded-lg border border-line bg-muted p-0.5">
              {FILTER_OPTIONS.map(({ key, label }) => (
                <Button
                  key={key}
                  type="button"
                  variant={filter === key ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter(key)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </FilterBar>
        ) : null}

        {!canLoadRegs ? (
          <EmptyState
            title="Check-in not open yet"
            description="The player list will appear here when check-in opens."
          />
        ) : regsQuery.isPending ? (
          <div className="space-y-2">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : regsQuery.isError ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {regsQuery.error instanceof Error
              ? regsQuery.error.message
              : 'Failed to load roster'}
          </p>
        ) : regs.length === 0 ? (
          <EmptyState
            title="No players registered"
            description="Players will appear here once they register for this event."
          />
        ) : filteredRegs.length === 0 ? (
          <EmptyState
            title="No players match your filter"
            description="Try a different search term or filter."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                  className={cn(
                    'flex flex-col rounded-xl border p-4 text-left shadow-sm transition',
                    canToggle && !busy
                      ? 'hover:border-primary/30 hover:bg-primary/[0.03] active:scale-[0.99]'
                      : 'cursor-default',
                    busy
                      ? 'border-primary/20 bg-primary/[0.04]'
                      : present && !withdrawn
                        ? 'border-emerald-200 bg-emerald-50/50'
                        : withdrawn
                          ? 'border-red-200/60 bg-red-50/30'
                          : 'border-line bg-card',
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                        busy
                          ? 'bg-primary/15 text-primary'
                          : withdrawn
                            ? 'bg-red-100 text-red-700'
                            : present
                              ? 'bg-emerald-500 text-white'
                              : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {busy ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : present && !withdrawn ? (
                        '✓'
                      ) : (
                        initials(row.user.firstName, row.user.lastName)
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold leading-tight text-ink">
                        {displayName(
                          row.user.firstName,
                          row.user.lastName,
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        <span>Unique Code:</span>{' '}
                        <span className="font-mono font-semibold tracking-wide text-ink/70">
                          {formatUniqueCode(row.user.username)}
                        </span>
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-bold',
                      busy
                        ? 'bg-primary/10 text-primary'
                        : withdrawn
                          ? 'bg-red-100 text-red-700'
                          : present
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {busy ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
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
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {attendanceMutation.error instanceof Error
              ? attendanceMutation.error.message
              : 'Could not update attendance'}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {eventQuery.isPending ? (
        <div className="space-y-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-12 w-full max-w-md" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : eventQuery.isError || !event ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {eventQuery.error instanceof Error
            ? eventQuery.error.message
            : 'Event not found'}
        </p>
      ) : (
        <>
          <PageHeader
            title={event.name}
            description={eventDescription}
            actions={
              <Badge variant={attendanceBadge.variant}>
                {attendanceBadge.label}
              </Badge>
            }
          />

          {isChess ? (
            <ChessWorkflowStepper
              gamesPerPlayer={event.gamesPerPlayer ?? 3}
              currentStep={workflowStep}
            />
          ) : null}

          {isChess ? (
            <Tabs
              value={mainTab}
              onValueChange={(value) => setMainTab(value as MainTab)}
            >
              <TabsList>
                <TabsTrigger value="checkin">{checkinTabLabel}</TabsTrigger>
                <TabsTrigger value="matchmaking">
                  {matchmakingTabLabel}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="checkin">{checkInPanel}</TabsContent>

              <TabsContent value="matchmaking">
                <ChessMatchmakingPanel
                  event={event}
                  presentCount={presentCount}
                />
              </TabsContent>
            </Tabs>
          ) : (
            checkInPanel
          )}
        </>
      )}
    </div>
  )
}
