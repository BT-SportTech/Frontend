import { useCallback, useMemo, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pagination } from '../../components/Pagination'
import {
  Button,
  CheckboxField,
  FieldLabel,
  GlassPanel,
  SelectInput,
  TextArea,
  TextInput,
} from '../../components/ui'
import { Modal } from '../../components/ui/Modal'
import {
  AGE_CATEGORIES,
  emptyEventForm,
  EVENT_GENDERS,
  eventToForm,
  type EventFormState,
} from '../../lib/eventForm'
import { getDistricts, getStates, withCurrentOption } from '../../lib/locations'
import { EventImageUploadField } from '../../components/events/EventImageUploadField'
import { resolveAssetUrl } from '../../lib/api'
import {
  cancelEvent,
  completeEvent,
  eventsKeys,
  fetchEventRegistrations,
  fetchEvents,
  publishEvent,
  saveEvent,
  submitEventResults,
  type EventRegistrationRow,
  type MatchOutcome,
} from '../../lib/queries/events'
import { fetchGames, gamesKeys } from '../../lib/queries/games'
import { fetchSchools, schoolsKeys } from '../../lib/queries/schools'
import type { EventStatus, Gender, SportEvent } from '../../lib/types'
import { useAdminSearchStore } from '../../stores/useAdminSearchStore'

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
  const queryClient = useQueryClient()
  const search = useAdminSearchStore((state) => state.events)
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [prevSearch, setPrevSearch] = useState(search)
  const [statusFilter, setStatusFilter] = useState<EventStatus | ''>('')
  const [actionError, setActionError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<EventFormState>(emptyEventForm())
  const [confirmAction, setConfirmAction] = useState<{
    id: string
    type: 'publish' | 'complete' | 'cancel'
    name: string
  } | null>(null)
  const [resultsEvent, setResultsEvent] = useState<{
    id: string
    name: string
  } | null>(null)
  const [resultsRows, setResultsRows] = useState<EventRegistrationRow[]>([])
  const [outcomes, setOutcomes] = useState<Record<string, MatchOutcome>>({})
  const [resultsLoading, setResultsLoading] = useState(false)
  const [resultsError, setResultsError] = useState('')
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

  const { data: schoolsData } = useQuery({
    queryKey: schoolsKeys.list({ page: 1, limit: 100 }),
    queryFn: () => fetchSchools({ page: 1, limit: 100 }),
  })

  const { data: gamesData } = useQuery({
    queryKey: gamesKeys.list({ page: 1, limit: 100, isActive: true }),
    queryFn: () => fetchGames({ page: 1, limit: 100, isActive: true }),
  })

  const events = data?.data ?? []
  const total = data?.meta.total ?? 0
  const totalPages = data?.meta.totalPages ?? 0
  const schools = schoolsData?.data ?? []
  const games = gamesData?.data ?? []
  const selectedGame = games.find((g) => g.id === form.gameId) ?? null

  const states = useMemo(() => getStates(), [])
  const districts = useMemo(
    () => withCurrentOption(getDistricts(form.state), form.district),
    [form.state, form.district],
  )

  const invalidate = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: eventsKeys.all })
  }, [queryClient])

  const saveMutation = useMutation({
    mutationFn: async () => saveEvent({ editingId, form }),
    onSuccess: async () => {
      setModalOpen(false)
      setActionError('')
      await invalidate()
    },
    onError: (err) => {
      setActionError(err instanceof Error ? err.message : 'Save failed')
    },
  })

  const statusMutation = useMutation({
    mutationFn: async ({
      id,
      type,
    }: {
      id: string
      type: 'publish' | 'complete' | 'cancel'
    }) => {
      if (type === 'publish') return publishEvent(id)
      if (type === 'complete') return completeEvent(id)
      return cancelEvent(id)
    },
    onSuccess: async () => {
      setConfirmAction(null)
      setActionError('')
      await invalidate()
    },
    onError: (err) => {
      setActionError(err instanceof Error ? err.message : 'Action failed')
      setConfirmAction(null)
    },
  })

  function openCreate() {
    setEditingId(null)
    setForm(emptyEventForm())
    setActionError('')
    setModalOpen(true)
  }

  function openEdit(event: SportEvent) {
    setEditingId(event.id)
    setForm(eventToForm(event))
    setActionError('')
    setModalOpen(true)
  }

  function patchForm<K extends keyof EventFormState>(
    key: K,
    value: EventFormState[K],
  ) {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'state') next.district = ''
      return next
    })
  }

  function toggleGender(gender: Gender) {
    setForm((prev) => ({
      ...prev,
      genders: prev.genders.includes(gender)
        ? prev.genders.filter((g) => g !== gender)
        : [...prev.genders, gender],
    }))
  }

  function toggleSchool(schoolId: string) {
    setForm((prev) => ({
      ...prev,
      schoolIds: prev.schoolIds.includes(schoolId)
        ? prev.schoolIds.filter((id) => id !== schoolId)
        : [...prev.schoolIds, schoolId],
    }))
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.gameId) {
      setActionError('Select a game from the catalog.')
      return
    }
    const hasState = Boolean(form.state.trim())
    const hasDistrict = Boolean(form.district.trim())
    if (hasState !== hasDistrict) {
      setActionError(
        'Set both state and district for a zone, or leave both empty for nationwide.',
      )
      return
    }
    saveMutation.mutate()
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
          <Button type="button" onClick={openCreate}>
            Create event
          </Button>
        </div>
      </div>

      {actionError || isError ? (
        <p className="rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-sm text-red-700">
          {actionError ||
            (listError instanceof Error
              ? listError.message
              : 'Failed to load events')}
        </p>
      ) : null}

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
                    className="border-b border-line/50 transition hover:bg-accent/25"
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
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {(event.status === 'DRAFT' ||
                          event.status === 'PUBLISHED') && (
                          <Button
                            type="button"
                            variant="ghost"
                            className="!px-2 !py-1 text-xs"
                            onClick={() => openEdit(event)}
                          >
                            Edit
                          </Button>
                        )}
                        {event.status === 'DRAFT' && (
                          <Button
                            type="button"
                            variant="secondary"
                            className="!px-2 !py-1 text-xs"
                            onClick={() =>
                              setConfirmAction({
                                id: event.id,
                                type: 'publish',
                                name: event.name,
                              })
                            }
                          >
                            Publish
                          </Button>
                        )}
                        {event.status === 'PUBLISHED' && (
                          <>
                            <Button
                              type="button"
                              variant="secondary"
                              className="!px-2 !py-1 text-xs"
                              onClick={async () => {
                                setResultsError('')
                                setResultsEvent({
                                  id: event.id,
                                  name: event.name,
                                })
                                setResultsLoading(true)
                                try {
                                  const res = await fetchEventRegistrations(
                                    event.id,
                                  )
                                  setResultsRows(res.data)
                                  const initial: Record<string, MatchOutcome> =
                                    {}
                                  for (const row of res.data) {
                                    initial[row.userId] =
                                      row.outcome ?? 'LOSS'
                                  }
                                  setOutcomes(initial)
                                } catch (e) {
                                  setResultsError(
                                    e instanceof Error
                                      ? e.message
                                      : 'Failed to load registrations',
                                  )
                                  setResultsRows([])
                                } finally {
                                  setResultsLoading(false)
                                }
                              }}
                            >
                              Results
                            </Button>
                            <Button
                              type="button"
                              variant="danger"
                              className="!px-2 !py-1 text-xs"
                              onClick={() =>
                                setConfirmAction({
                                  id: event.id,
                                  type: 'cancel',
                                  name: event.name,
                                })
                              }
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                        {event.status === 'COMPLETED' && (
                          <Button
                            type="button"
                            variant="secondary"
                            className="!px-2 !py-1 text-xs"
                            onClick={async () => {
                              setResultsError('')
                              setResultsEvent({
                                id: event.id,
                                name: event.name,
                              })
                              setResultsLoading(true)
                              try {
                                const res = await fetchEventRegistrations(
                                  event.id,
                                )
                                setResultsRows(res.data)
                                const initial: Record<string, MatchOutcome> =
                                  {}
                                for (const row of res.data) {
                                  initial[row.userId] = row.outcome ?? 'LOSS'
                                }
                                setOutcomes(initial)
                              } catch (e) {
                                setResultsError(
                                  e instanceof Error
                                    ? e.message
                                    : 'Failed to load registrations',
                                )
                                setResultsRows([])
                              } finally {
                                setResultsLoading(false)
                              }
                            }}
                          >
                            Results
                          </Button>
                        )}
                        {event.status === 'DRAFT' && (
                          <Button
                            type="button"
                            variant="danger"
                            className="!px-2 !py-1 text-xs"
                            onClick={() =>
                              setConfirmAction({
                                id: event.id,
                                type: 'cancel',
                                name: event.name,
                              })
                            }
                          >
                            Cancel
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
        open={modalOpen}
        title={editingId ? 'Edit event' : 'Create event'}
        onClose={() => setModalOpen(false)}
        className="max-w-2xl"
      >
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FieldLabel>Event name</FieldLabel>
              <TextInput
                required
                value={form.name}
                onChange={(e) => patchForm('name', e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <EventImageUploadField
                imageUrl={form.imageUrl}
                imageFile={form.imageFile}
                onSelect={(file) =>
                  setForm((prev) => ({
                    ...prev,
                    imageFile: file,
                    imageUrl: prev.imageUrl,
                  }))
                }
                onClear={() =>
                  setForm((prev) => ({
                    ...prev,
                    imageFile: null,
                    imageUrl: '',
                  }))
                }
              />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel>Game</FieldLabel>
              <SelectInput
                required
                value={form.gameId}
                onChange={(e) => {
                  const gameId = e.target.value
                  const game = games.find((g) => g.id === gameId)
                  setForm((prev) => ({
                    ...prev,
                    gameId,
                    pointsReward: game
                      ? String(game.winPoints)
                      : prev.pointsReward,
                  }))
                }}
              >
                <option value="">Select game</option>
                {games.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </SelectInput>
              {selectedGame ? (
                <div className="mt-2 flex flex-wrap items-center gap-3 rounded-lg border border-line bg-white/80 px-3 py-2.5">
                  {selectedGame.imageUrl ? (
                    <img
                      src={resolveAssetUrl(selectedGame.imageUrl)}
                      alt=""
                      className="h-8 w-12 shrink-0 rounded object-cover"
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">{selectedGame.name}</p>
                    <p className="mt-0.5 text-sm text-ink/55">
                      Players per match{' '}
                      <span className="font-mono font-semibold tabular-nums text-ink">
                        {selectedGame.sidesPerMatch} &times;{' '}
                        {selectedGame.playersPerSide} ={' '}
                        {selectedGame.playersPerMatch}
                      </span>
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
            <div>
              <FieldLabel>Age category</FieldLabel>
              <SelectInput
                value={form.ageCategory}
                onChange={(e) =>
                  patchForm('ageCategory', e.target.value as EventFormState['ageCategory'])
                }
              >
                {AGE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </SelectInput>
            </div>
            <div className="sm:col-span-2">
              <FieldLabel>Description</FieldLabel>
              <TextArea
                rows={3}
                value={form.description}
                onChange={(e) => patchForm('description', e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel>Venue</FieldLabel>
              <TextInput
                required
                value={form.venue}
                onChange={(e) => patchForm('venue', e.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Starts at</FieldLabel>
              <TextInput
                type="datetime-local"
                required
                value={form.startsAt}
                onChange={(e) => patchForm('startsAt', e.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Ends at (optional)</FieldLabel>
              <TextInput
                type="datetime-local"
                value={form.endsAt}
                onChange={(e) => patchForm('endsAt', e.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Registration opens</FieldLabel>
              <TextInput
                type="datetime-local"
                required
                value={form.registrationOpensAt}
                onChange={(e) =>
                  patchForm('registrationOpensAt', e.target.value)
                }
              />
            </div>
            <div>
              <FieldLabel>Registration closes</FieldLabel>
              <TextInput
                type="datetime-local"
                required
                value={form.registrationClosesAt}
                onChange={(e) =>
                  patchForm('registrationClosesAt', e.target.value)
                }
              />
            </div>
            <div>
              <FieldLabel>Max participants</FieldLabel>
              <TextInput
                type="number"
                min={1}
                required
                value={form.maxParticipants}
                onChange={(e) => patchForm('maxParticipants', e.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Fee</FieldLabel>
              <TextInput
                type="number"
                min={0}
                step="0.01"
                value={form.fee}
                onChange={(e) => patchForm('fee', e.target.value)}
              />
            </div>
            <div>
              <FieldLabel>State (optional zone)</FieldLabel>
              <SelectInput
                value={form.state}
                onChange={(e) => patchForm('state', e.target.value)}
              >
                <option value="">Nationwide</option>
                {states.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </SelectInput>
            </div>
            <div>
              <FieldLabel>District (optional zone)</FieldLabel>
              <SelectInput
                value={form.district}
                disabled={!form.state}
                onChange={(e) => patchForm('district', e.target.value)}
              >
                <option value="">
                  {form.state ? 'Select district' : 'Nationwide'}
                </option>
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </SelectInput>
            </div>
            <div>
              <FieldLabel>Points reward</FieldLabel>
              <TextInput
                type="number"
                min={0}
                value={form.pointsReward}
                onChange={(e) => patchForm('pointsReward', e.target.value)}
              />
            </div>
          </div>

          <div>
            <FieldLabel>Eligible genders (empty = all)</FieldLabel>
            <div className="mt-1 flex flex-wrap gap-4">
              {EVENT_GENDERS.map((g) => (
                <CheckboxField
                  key={g}
                  label={g.replaceAll('_', ' ')}
                  checked={form.genders.includes(g)}
                  onChange={() => toggleGender(g)}
                />
              ))}
            </div>
          </div>

          <div>
            <FieldLabel>
              Target schools (optional — empty = all eligible schools)
            </FieldLabel>
            <div className="mt-2 max-h-36 space-y-2 overflow-y-auto rounded-lg border border-line bg-white/70 p-3">
              {schools.length === 0 ? (
                <p className="text-sm text-ink/50">No schools available</p>
              ) : (
                schools.map((school) => (
                  <CheckboxField
                    key={school.id}
                    label={`${school.name} (${school.code})`}
                    checked={form.schoolIds.includes(school.id)}
                    onChange={() => toggleSchool(school.id)}
                  />
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setModalOpen(false)}
            >
              Close
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending
                ? 'Saving…'
                : editingId
                  ? 'Save changes'
                  : 'Save draft'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!confirmAction}
        title={
          confirmAction?.type === 'publish'
            ? 'Publish event'
            : confirmAction?.type === 'complete'
              ? 'Complete event'
              : 'Cancel event'
        }
        onClose={() => setConfirmAction(null)}
      >
        <p className="text-sm text-ink/70">
          {confirmAction?.type === 'publish'
            ? `Publish “${confirmAction.name}”? It will appear in the mobile app for eligible players.`
            : confirmAction?.type === 'complete'
              ? `Mark “${confirmAction?.name}” as completed?`
              : `Cancel “${confirmAction?.name}”? Players will no longer see it as available.`}
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setConfirmAction(null)}
          >
            Back
          </Button>
          <Button
            type="button"
            variant={confirmAction?.type === 'cancel' ? 'danger' : 'primary'}
            disabled={statusMutation.isPending}
            onClick={() => {
              if (!confirmAction) return
              statusMutation.mutate({
                id: confirmAction.id,
                type: confirmAction.type,
              })
            }}
          >
            {statusMutation.isPending ? 'Working…' : 'Confirm'}
          </Button>
        </div>
      </Modal>

      <Modal
        open={!!resultsEvent}
        title={
          resultsEvent
            ? `Results · ${resultsEvent.name}`
            : 'Event results'
        }
        onClose={() => {
          setResultsEvent(null)
          setResultsRows([])
          setOutcomes({})
          setResultsError('')
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
            {resultsRows.map((row) => {
              const name =
                `${row.user.firstName} ${row.user.lastName}`.trim() ||
                row.user.username
              return (
                <div
                  key={row.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-ink/10 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      {name}
                    </p>
                    <p className="truncate text-xs text-ink/50">
                      @{row.user.username}
                    </p>
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
              )
            })}
          </div>
        )}
        {resultsError ? (
          <p className="mt-3 text-sm text-red-600">{resultsError}</p>
        ) : null}
        <div className="mt-5 flex justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setResultsEvent(null)
              setResultsRows([])
              setOutcomes({})
              setResultsError('')
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
              setResultsError('')
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
              } catch (e) {
                setResultsError(
                  e instanceof Error ? e.message : 'Failed to save results',
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
