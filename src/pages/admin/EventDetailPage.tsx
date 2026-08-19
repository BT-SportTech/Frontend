import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatGrid } from '@/components/layout/StatGrid'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  CheckboxField,
} from '../../components/ui'
import { resolveAssetUrl } from '../../lib/api'
import { displayName } from '../../lib/displayName'
import { rankTierFromPoints } from '../../lib/rankTier'
import { formatUniqueCode } from '../../lib/uniqueCode'
import {
  eventsKeys,
  fetchEvent,
  fetchEventRegistrations,
  updateEvent,
} from '../../lib/queries/events'
import {
  fetchOrganizers,
  organizersKeys,
} from '../../lib/queries/organizers'
import { EventCompletedResultsPanel } from '../../components/events/EventCompletedResultsPanel'
import { toast } from '../../stores/useToastStore'

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function EventDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [selectedOrganizerIds, setSelectedOrganizerIds] = useState<string[]>([])

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

  const canAssign =
    event?.status === 'DRAFT' || event?.status === 'PUBLISHED'

  const { data: organizersData, isPending: organizersPending } = useQuery({
    queryKey: organizersKeys.list(),
    queryFn: fetchOrganizers,
    enabled: Boolean(event) && canAssign,
  })

  const organizers = organizersData?.organizers ?? []
  const assignedOrganizers = event?.organizers ?? []

  useEffect(() => {
    if (event?.organizerIds) {
      setSelectedOrganizerIds(event.organizerIds)
    } else if (event?.organizers) {
      setSelectedOrganizerIds(event.organizers.map((o) => o.id))
    }
  }, [event?.id, event?.organizerIds, event?.organizers])

  const assignMutation = useMutation({
    mutationFn: () => updateEvent(id, { organizerIds: selectedOrganizerIds }),
    onSuccess: async () => {
      toast.success('Organisers updated.')
      await queryClient.invalidateQueries({ queryKey: eventsKeys.detail(id) })
      await queryClient.invalidateQueries({ queryKey: eventsKeys.lists() })
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : 'Failed to update organisers',
      )
    },
  })

  function toggleOrganizer(organizerId: string) {
    setSelectedOrganizerIds((prev) =>
      prev.includes(organizerId)
        ? prev.filter((x) => x !== organizerId)
        : [...prev, organizerId],
    )
  }

  useEffect(() => {
    if (!regsError) return
    toast.error(
      regsErr instanceof Error
        ? regsErr.message
        : 'Failed to load registrations',
    )
  }, [regsError, regsErr])

  const registrations = regsData?.data ?? []
  const isCompleted = event?.status === 'COMPLETED'
  const defaultTab = isCompleted ? 'results' : 'overview'
  const [activeTab, setActiveTab] = useState(defaultTab)

  useEffect(() => {
    setActiveTab(event?.status === 'COMPLETED' ? 'results' : 'overview')
  }, [event?.id, event?.status])

  const registeredCount = event?.registeredCount ?? registrations.length
  const maxParticipants = event?.maxParticipants ?? 0
  const seatsLeft =
    event?.seatsLeft ?? Math.max(0, maxParticipants - registeredCount)
  const fillPct =
    maxParticipants > 0
      ? Math.min(100, Math.round((registeredCount / maxParticipants) * 100))
      : 0

  const assignedChanged =
    !!event &&
    (() => {
      const current = [...(event.organizerIds ?? event.organizers?.map((o) => o.id) ?? [])].sort()
      const next = [...selectedOrganizerIds].sort()
      return (
        current.length !== next.length ||
        current.some((value, index) => value !== next[index])
      )
    })()

  return (
    <div className="space-y-6">
      {eventPending ? (
        <EventDetailSkeleton />
      ) : eventError || !event ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {eventErr instanceof Error ? eventErr.message : 'Event not found'}
        </p>
      ) : (
        <>
          <PageHeader
            title={event.name}
            description={`${event.sport}${event.ageCategory ? ` · ${event.ageCategory}` : ''} · ${event.venue}`}
            actions={
              <Badge
                variant={
                  event.status === 'PUBLISHED'
                    ? 'success'
                    : event.status === 'COMPLETED'
                      ? 'default'
                      : event.status === 'CANCELLED'
                        ? 'destructive'
                        : 'outline'
                }
              >
                {event.status}
              </Badge>
            }
          />

          <StatGrid
            items={[
              { label: 'Registered', value: registeredCount, accent: 'primary' },
              { label: 'Capacity', value: maxParticipants, accent: 'secondary' },
              { label: 'Seats left', value: seatsLeft, accent: 'primary' },
              { label: 'Filled', value: `${fillPct}%`, accent: 'secondary' },
            ]}
          />

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              {isCompleted ? (
                <TabsTrigger value="results">Results</TabsTrigger>
              ) : null}
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="registrations">
                Registrations
                {registeredCount > 0 ? ` (${registeredCount})` : ''}
              </TabsTrigger>
              <TabsTrigger value="organisers">Organisers</TabsTrigger>
            </TabsList>

            {isCompleted ? (
              <TabsContent value="results">
                <EventCompletedResultsPanel
                  event={event}
                  registrations={registrations}
                  isPending={regsPending}
                />
              </TabsContent>
            ) : null}

            <TabsContent value="overview">
              <Card>
                <CardContent className="p-0">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-stretch">
                    {event.imageUrl ? (
                      <img
                        src={resolveAssetUrl(event.imageUrl)}
                        alt=""
                        className="h-40 w-full shrink-0 object-cover sm:h-auto sm:w-56"
                      />
                    ) : (
                      <div className="flex h-40 w-full shrink-0 items-center justify-center bg-muted text-sm text-muted-foreground sm:h-auto sm:w-56">
                        No banner
                      </div>
                    )}
                    <div className="min-w-0 flex-1 p-5 sm:py-6 sm:pr-6 sm:pl-0">
                      <dl className="grid gap-3 text-sm sm:grid-cols-2">
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Venue
                          </dt>
                          <dd className="mt-0.5 font-medium text-ink">{event.venue}</dd>
                        </div>
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Starts
                          </dt>
                          <dd className="mt-0.5 font-medium text-ink">
                            {formatWhen(event.startsAt)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Zone
                          </dt>
                          <dd className="mt-0.5 font-medium text-ink">
                            {event.state?.trim() && event.district?.trim()
                              ? `${event.district}, ${event.state}`
                              : 'Nationwide'}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Registration window
                          </dt>
                          <dd className="mt-0.5 font-medium text-ink">
                            {formatWhen(event.registrationOpensAt)} –{' '}
                            {formatWhen(event.registrationClosesAt)}
                          </dd>
                        </div>
                      </dl>
                      {event.description ? (
                        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                          {event.description}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="registrations">
              <Card>
                <CardContent className="p-6">
                  {regsPending ? (
                    <PlayersTableSkeleton />
                  ) : registrations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No players have registered for this event yet.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Player</TableHead>
                          <TableHead>Code</TableHead>
                          <TableHead>Rank</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Attendance</TableHead>
                          <TableHead>Registered</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {registrations.map((row, index) => {
                          const fullName =
                            `${row.user.firstName} ${row.user.lastName}`.trim() ||
                            row.user.username
                          const rank = rankTierFromPoints(row.user.totalPoints ?? 0)
                          return (
                            <TableRow key={row.id}>
                              <TableCell className="tabular-nums text-muted-foreground">
                                {index + 1}
                              </TableCell>
                              <TableCell className="font-semibold">{fullName}</TableCell>
                              <TableCell>{formatUniqueCode(row.user.username)}</TableCell>
                              <TableCell>{rank}</TableCell>
                              <TableCell>{row.user.email ?? '—'}</TableCell>
                              <TableCell>
                                {row.attendedAt ? (
                                  <span className="font-semibold text-emerald-700">
                                    Present
                                  </span>
                                ) : (
                                  '—'
                                )}
                              </TableCell>
                              <TableCell>{formatWhen(row.registeredAt)}</TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="organisers">
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold text-ink">
                        {canAssign ? 'Assign organisers' : 'Event organisers'}
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {canAssign
                          ? 'Choose who can take attendance for this event.'
                          : 'Organisers who conducted this event. Assignments cannot be changed after completion.'}
                      </p>
                    </div>
                    {canAssign ? (
                      <Button
                        type="button"
                        disabled={
                          !assignedChanged || assignMutation.isPending || !canAssign
                        }
                        onClick={() => assignMutation.mutate()}
                      >
                        {assignMutation.isPending ? 'Saving…' : 'Save organisers'}
                      </Button>
                    ) : null}
                  </div>

                  {!canAssign ? (
                    assignedOrganizers.length === 0 ? (
                      <p className="mt-4 text-sm text-muted-foreground">
                        No organisers were assigned to this event.
                      </p>
                    ) : (
                      <Table className="mt-4">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Organiser</TableHead>
                            <TableHead>Code</TableHead>
                            <TableHead>Email</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {assignedOrganizers.map((organizer) => (
                            <TableRow key={organizer.id}>
                              <TableCell className="font-semibold">
                                {displayName(
                                  organizer.firstName,
                                  organizer.lastName,
                                ) || organizer.username}
                              </TableCell>
                              <TableCell>
                                {formatUniqueCode(organizer.username)}
                              </TableCell>
                              <TableCell>{organizer.email ?? '—'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )
                  ) : organizersPending ? (
                    <div className="mt-4 space-y-2">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ) : organizers.length === 0 ? (
                    <p className="mt-4 text-sm text-muted-foreground">
                      No organisers yet.{' '}
                      <Link
                        to="/admin/organizers"
                        className="font-semibold text-primary hover:text-primary-hover"
                      >
                        Invite an organiser
                      </Link>{' '}
                      first.
                    </p>
                  ) : (
                    <div className="mt-4 max-h-56 space-y-2 overflow-y-auto rounded-lg border border-line bg-white p-3">
                      {organizers.map((org) => (
                        <CheckboxField
                          key={org.id}
                          label={`${org.firstName} ${org.lastName} (${org.email ?? org.username})`}
                          checked={selectedOrganizerIds.includes(org.id)}
                          onChange={() => toggleOrganizer(org.id)}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
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
          <div key={i} className="rounded-xl border border-line p-5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-8 w-16" />
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-line">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-stretch">
          <Skeleton className="h-40 w-full shrink-0 sm:h-auto sm:min-h-[10rem] sm:w-56" />
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
      </div>

      <div className="rounded-xl border border-line p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
        <PlayersTableSkeleton />
      </div>
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
