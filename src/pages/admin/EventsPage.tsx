import { useCallback, useEffect, useState, type MouseEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Pagination } from '../../components/Pagination'
import { Button, GlassPanel, SelectInput } from '../../components/ui'
import { Modal } from '../../components/ui/Modal'
import { PlayerIdentity } from '../../components/PlayerIdentity'
import { resolveAssetUrl } from '../../lib/api'
import {
  eventsKeys,
  fetchEventRegistrations,
  fetchEvents,
  publishEvent,
  submitEventResults,
  type EventRegistrationRow,
  type MatchOutcome,
} from '../../lib/queries/events'
import type { EventStatus, SportEvent } from '../../lib/types'
import { useAdminSearchStore } from '../../stores/useAdminSearchStore'
import { toast } from '../../stores/useToastStore'

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

export function EventsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const search = useAdminSearchStore((state) => state.events)
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [prevSearch, setPrevSearch] = useState(search)
  const [statusFilter, setStatusFilter] = useState<EventStatus | ''>('')
  const [confirmPublish, setConfirmPublish] = useState<{
    id: string
    name: string
  } | null>(null)
  const [resultsEvent, setResultsEvent] = useState<{
    id: string
    name: string
  } | null>(null)
  const [resultsRows, setResultsRows] = useState<EventRegistrationRow[]>([])
  const [outcomes, setOutcomes] = useState<Record<string, MatchOutcome>>({})
  const [resultsLoading, setResultsLoading] = useState(false)
  const [resultsSaving, setResultsSaving] = useState(false)

  if (search !== prevSearch) {
    setPrevSearch(search)
    setPage(1)
  }

  const listPage = search !== prevSearch ? 1 : page

  const {
    data,
    isPending,
    isError,
    error: listError,
  } = useQuery({
    queryKey: eventsKeys.list({
      page: listPage,
      limit,
      search,
      status: statusFilter || undefined,
    }),
    queryFn: () =>
      fetchEvents({
        page: listPage,
        limit,
        search,
        status: statusFilter || undefined,
      }),
  })

  const events = data?.data ?? []
  const total = data?.meta.total ?? 0
  const totalPages = data?.meta.totalPages ?? 0

  const invalidate = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: eventsKeys.all })
  }, [queryClient])

  const publishMutation = useMutation({
    mutationFn: async (id: string) => publishEvent(id),
    onSuccess: async () => {
      setConfirmPublish(null)
      toast.success('Event published.')
      await invalidate()
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Publish failed')
      setConfirmPublish(null)
    },
  })

  useEffect(() => {
    if (!isError) return
    toast.error(
      listError instanceof Error ? listError.message : 'Failed to load events',
    )
  }, [isError, listError])

  async function openResults(event: SportEvent, e: MouseEvent) {
    e.stopPropagation()
    setResultsEvent({ id: event.id, name: event.name })
    setResultsLoading(true)
    try {
      const res = await fetchEventRegistrations(event.id)
      setResultsRows(res.data)
      const initial: Record<string, MatchOutcome> = {}
      for (const row of res.data) {
        initial[row.userId] = row.outcome ?? 'LOSS'
      }
      setOutcomes(initial)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to load registrations',
      )
      setResultsRows([])
    } finally {
      setResultsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
            Events
          </h1>
          <p className="mt-1.5 text-sm text-ink/55">
            Create, schedule, and publish sports events
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SelectInput
            className="w-40"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as EventStatus | '')
              setPage(1)
            }}
          >
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </SelectInput>
          <Button type="button" onClick={() => navigate('/admin/events/new')}>
            Create event
          </Button>
        </div>
      </div>

      <GlassPanel strong className="overflow-hidden">
        <div className="min-h-[28rem] overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm text-ink">
            <thead className="border-b border-line bg-accent/40 text-ink/80">
              <tr>
                <th className="px-4 py-3 font-semibold">Event</th>
                <th className="px-4 py-3 font-semibold">Sport</th>
                <th className="px-4 py-3 font-semibold">When</th>
                <th className="px-4 py-3 font-semibold">Zone</th>
                <th className="px-4 py-3 font-semibold">Seats</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isPending ? (
                <tr>
                  <td
                    colSpan={7}
                    className="h-[24rem] px-4 text-center align-middle text-ink/60"
                  >
                    Loading…
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="h-[24rem] px-4 text-center align-middle text-ink/60"
                  >
                    No events found
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr
                    key={event.id}
                    className="cursor-pointer border-b border-line/50 transition hover:bg-accent/25"
                    onClick={() => navigate(`/admin/events/${event.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {event.imageUrl ? (
                          <img
                            src={resolveAssetUrl(event.imageUrl)}
                            alt=""
                            className="h-10 w-14 shrink-0 rounded-md object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-14 shrink-0 items-center justify-center rounded-md bg-accent/50 text-[10px] text-ink/40">
                            No img
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-ink">{event.name}</p>
                          <p className="text-xs text-ink/50">{event.venue}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-ink/90">
                      {event.sport}
                      <span className="mt-0.5 block text-xs text-ink/45">
                        {event.ageCategory}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-ink/90">
                      {formatWhen(event.startsAt)}
                    </td>
                    <td className="px-4 py-3 font-medium text-ink/90">
                      {event.state?.trim() && event.district?.trim()
                        ? `${event.district}, ${event.state}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 font-medium text-ink/90">
                      {event.registeredCount}/{event.maxParticipants}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[event.status]}`}
                      >
                        {event.status}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          className="!px-2 !py-1 text-xs"
                          onClick={() => navigate(`/admin/events/${event.id}`)}
                        >
                          View
                        </Button>
                        {event.status === 'DRAFT' && (
                          <Button
                            type="button"
                            variant="secondary"
                            className="!px-2 !py-1 text-xs"
                            onClick={() =>
                              setConfirmPublish({
                                id: event.id,
                                name: event.name,
                              })
                            }
                          >
                            Publish
                          </Button>
                        )}
                        {(event.status === 'PUBLISHED' ||
                          event.status === 'COMPLETED') && (
                          <Button
                            type="button"
                            variant="secondary"
                            className="!px-2 !py-1 text-xs"
                            onClick={(e) => void openResults(event, e)}
                          >
                            Results
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 pb-4">
          <Pagination
            page={listPage}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
          />
        </div>
      </GlassPanel>

      <Modal
        open={!!confirmPublish}
        title="Publish event"
        onClose={() => setConfirmPublish(null)}
      >
        <p className="text-sm text-ink/70">
          Publish “{confirmPublish?.name}”? It will appear in the mobile app for
          eligible players.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setConfirmPublish(null)}
          >
            Back
          </Button>
          <Button
            type="button"
            disabled={publishMutation.isPending}
            onClick={() => {
              if (!confirmPublish) return
              publishMutation.mutate(confirmPublish.id)
            }}
          >
            {publishMutation.isPending ? 'Working…' : 'Confirm'}
          </Button>
        </div>
      </Modal>

      <Modal
        open={!!resultsEvent}
        title={
          resultsEvent ? `Results · ${resultsEvent.name}` : 'Event results'
        }
        onClose={() => {
          setResultsEvent(null)
          setResultsRows([])
          setOutcomes({})
        }}
      >
        <p className="mb-4 text-sm text-ink/70">
          Set WIN / LOSS / DRAW for each player. Saving marks the event
          completed and awards points to player profiles.
        </p>
        {resultsLoading ? (
          <p className="text-sm text-ink/60">Loading registrations…</p>
        ) : resultsRows.length === 0 ? (
          <p className="text-sm text-ink/60">
            No confirmed registrations for this event.
          </p>
        ) : (
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {resultsRows.map((row) => (
              <div
                key={row.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-ink/10 px-3 py-2"
              >
                <div className="min-w-0">
                  <PlayerIdentity
                    username={row.user.username}
                    firstName={row.user.firstName}
                    lastName={row.user.lastName}
                    totalPoints={row.user.totalPoints}
                  />
                </div>
                <SelectInput
                  className="!w-28 !py-1.5 text-sm"
                  value={outcomes[row.userId] ?? 'LOSS'}
                  onChange={(e) =>
                    setOutcomes((prev) => ({
                      ...prev,
                      [row.userId]: e.target.value as MatchOutcome,
                    }))
                  }
                >
                  <option value="WIN">Win</option>
                  <option value="LOSS">Loss</option>
                  <option value="DRAW">Draw</option>
                </SelectInput>
              </div>
            ))}
          </div>
        )}
        <div className="mt-5 flex justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setResultsEvent(null)
              setResultsRows([])
              setOutcomes({})
            }}
          >
            Close
          </Button>
          <Button
            type="button"
            disabled={
              resultsSaving || resultsLoading || resultsRows.length === 0
            }
            onClick={async () => {
              if (!resultsEvent) return
              setResultsSaving(true)
              try {
                await submitEventResults(
                  resultsEvent.id,
                  resultsRows.map((row) => ({
                    userId: row.userId,
                    outcome: outcomes[row.userId] ?? 'LOSS',
                  })),
                )
                await invalidate()
                setResultsEvent(null)
                setResultsRows([])
                setOutcomes({})
                toast.success('Results saved and event marked complete.')
              } catch (err) {
                toast.error(
                  err instanceof Error ? err.message : 'Failed to save results',
                )
              } finally {
                setResultsSaving(false)
              }
            }}
          >
            {resultsSaving ? 'Saving…' : 'Save results & complete'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
