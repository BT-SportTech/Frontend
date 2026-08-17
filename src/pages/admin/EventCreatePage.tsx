import {
  useCallback,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import {
  Button,
  CheckboxField,
  FieldLabel,
  GlassPanel,
} from '../../components/ui'
import { MultiSelectDropdown } from '../../components/ui/MultiSelectDropdown'
import {
  ADMIN_EVENT_GAMES,
  AGE_CATEGORIES,
  emptyEventForm,
  EVENT_GENDERS,
  type EventFormState,
} from '../../lib/eventForm'
import { getDistricts, getStates, matchDistrictOption, matchStateOption, withCurrentOption } from '../../lib/locations'
import { EventImageUploadField } from '../../components/events/EventImageUploadField'
import {
  SelectFormField,
  TextAreaFormField,
  TextFormField,
} from '../../components/events/EventFormField'
import { PlaceAutocompleteField } from '../../components/places/PlaceAutocompleteField'
import { EventMobilePreview } from '../../components/events/EventMobilePreview'
import { isApiError, resolveAssetUrl } from '../../lib/api'
import { eventsKeys, saveEvent } from '../../lib/queries/events'
import { fetchGames, gamesKeys } from '../../lib/queries/games'
import { fetchOrganizers, organizersKeys } from '../../lib/queries/organizers'
import { fetchSchools, schoolsKeys } from '../../lib/queries/schools'
import type { Gender } from '../../lib/types'
import { toast } from '../../stores/useToastStore'
import {
  buildEventFormSchema,
  parseEventFieldErrors,
} from '../../schemas/eventForm.schema'

const EVENT_FIELD_ORDER: (keyof EventFormState)[] = [
  'name',
  'gameId',
  'venue',
  'startsAt',
  'endsAt',
  'registrationOpensAt',
  'registrationClosesAt',
  'maxParticipants',
  'boardCount',
  'gamesPerPlayer',
  'state',
  'district',
  'fee',
]

const ADMIN_GAME_NAME_SET = new Set<string>(ADMIN_EVENT_GAMES)

function FormSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="space-y-4">
      <div className="border-b border-line/70 pb-3">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-xs text-ink/50">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  )
}

export function EventCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<EventFormState>(emptyEventForm)
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof EventFormState, string>>
  >({})
  const [formError, setFormError] = useState('')

  const { data: schoolsData } = useQuery({
    queryKey: schoolsKeys.list({ page: 1, limit: 100 }),
    queryFn: () => fetchSchools({ page: 1, limit: 100 }),
  })

  const { data: gamesData } = useQuery({
    queryKey: gamesKeys.list({ page: 1, limit: 100, isActive: true }),
    queryFn: () => fetchGames({ page: 1, limit: 100, isActive: true }),
  })

  const { data: organizersData } = useQuery({
    queryKey: organizersKeys.list(),
    queryFn: fetchOrganizers,
  })

  const schools = schoolsData?.data ?? []
  const organizers = organizersData?.organizers ?? []
  const schoolOptions = useMemo(
    () =>
      schools.map((school) => ({
        value: school.id,
        label: `${school.name} (${school.code})`,
      })),
    [schools],
  )
  const organizerOptions = useMemo(
    () =>
      organizers.map((org) => ({
        value: org.id,
        label: `${org.firstName} ${org.lastName} (${org.email ?? org.username})`,
      })),
    [organizers],
  )
  const games = useMemo(() => {
    const active = gamesData?.data ?? []
    return ADMIN_EVENT_GAMES.map((name) =>
      active.find((g) => g.name === name),
    ).filter((g): g is NonNullable<typeof g> => Boolean(g))
  }, [gamesData?.data])
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
    mutationFn: async () => saveEvent({ editingId: null, form }),
    onSuccess: async (event) => {
      setFieldErrors({})
      setFormError('')
      toast.success('Event saved as draft.')
      await invalidate()
      navigate(`/admin/events/${event.id}`)
    },
    onError: (err) => {
      if (isApiError(err)) {
        setFieldErrors(err.fieldErrors)
        setFormError(
          Object.keys(err.fieldErrors).length === 0 ? err.message : '',
        )
        if (Object.keys(err.fieldErrors).length === 0) {
          toast.error(err.message)
        }
        scrollToFirstFieldError(err.fieldErrors)
        return
      }
      setFormError('')
      toast.error(err instanceof Error ? err.message : 'Save failed')
    },
  })

  function scrollToFirstFieldError(
    errors: Partial<Record<keyof EventFormState, string>>,
  ) {
    const firstKey = EVENT_FIELD_ORDER.find((key) => errors[key])
    if (!firstKey) return
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-event-field="${firstKey}"]`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      if (el instanceof HTMLElement) {
        const input = el.querySelector('input, select, textarea, button')
        if (input instanceof HTMLElement) input.focus()
      }
    })
  }

  function patchForm<K extends keyof EventFormState>(
    key: K,
    value: EventFormState[K],
  ) {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
    setFormError('')
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'state') next.district = ''
      return next
    })
  }

  function applyPlaceToForm(result: {
    venue: string
    details: {
      state?: string
      district?: string
      city?: string
    }
  }) {
    const matchedState = matchStateOption(result.details.state)
    const matchedDistrict = matchedState
      ? matchDistrictOption(
          matchedState,
          result.details.district,
          result.details.city,
        )
      : ''

    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next.venue
      if (matchedState) delete next.state
      if (matchedDistrict) delete next.district
      return next
    })
    setFormError('')
    setForm((prev) => ({
      ...prev,
      venue: result.venue,
      ...(matchedState
        ? {
            state: matchedState,
            district: matchedDistrict,
          }
        : {}),
    }))
  }

  function toggleGender(gender: Gender) {
    setForm((prev) => ({
      ...prev,
      genders: prev.genders.includes(gender)
        ? prev.genders.filter((g) => g !== gender)
        : [...prev.genders, gender],
    }))
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError('')

    const schema = buildEventFormSchema(selectedGame?.name === 'Chess')
    const parsed = schema.safeParse(form)
    if (!parsed.success) {
      const errors = parseEventFieldErrors(parsed.error)
      setFieldErrors(errors)
      scrollToFirstFieldError(errors)
      return
    }

    setFieldErrors({})
    saveMutation.mutate()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            to="/admin/events"
            className="text-sm font-semibold text-primary hover:underline"
          >
            ← Events
          </Link>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink">
            Create event
          </h1>
          <p className="mt-1.5 text-sm text-ink/55">
            Fill in the details — the phone on the right updates as you type
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/admin/events')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="event-create-form"
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? 'Saving…' : 'Save draft'}
          </Button>
        </div>
      </div>

      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        <GlassPanel strong className="p-5 sm:p-7">
          <form
            id="event-create-form"
            className="space-y-8"
            onSubmit={onSubmit}
          >
            {formError ? (
              <p
                className="rounded-none border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
                role="alert"
              >
                {formError}
              </p>
            ) : null}

            <FormSection
              title="Basics"
              description="Name, sport, and what players see first"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2" data-event-field="name">
                  <TextFormField
                    label="Event name"
                    required
                    placeholder="e.g. District Chess Open"
                    value={form.name}
                    error={fieldErrors.name}
                    onChange={(e) => patchForm('name', e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <EventImageUploadField
                    imageUrl={form.imageUrl}
                    imageFile={form.imageFile}
                    error={fieldErrors.imageUrl}
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
                <div className="sm:col-span-2" data-event-field="gameId">
                  <SelectFormField
                    label="Game"
                    required
                    value={form.gameId}
                    error={fieldErrors.gameId}
                    onChange={(e) => {
                      const gameId = e.target.value
                      setForm((prev) => ({
                        ...prev,
                        gameId,
                      }))
                      setFieldErrors((prev) => {
                        if (!prev.gameId) return prev
                        const next = { ...prev }
                        delete next.gameId
                        return next
                      })
                    }}
                  >
                    <option value="">Select game</option>
                    {games.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </SelectFormField>
                  {games.length === 0 ? (
                    <p className="mt-2 text-sm text-ink/55">
                      No catalog games found. Run the backend seed to add{' '}
                      {ADMIN_EVENT_GAMES.join(', ')}.
                    </p>
                  ) : null}
                  {selectedGame &&
                  ADMIN_GAME_NAME_SET.has(selectedGame.name) ? (
                    <div className="mt-2 flex flex-wrap items-center gap-3 rounded-none border border-line/80 bg-bg px-3.5 py-2.5">
                      {selectedGame.imageUrl ? (
                        <img
                          src={resolveAssetUrl(selectedGame.imageUrl)}
                          alt=""
                          className="h-9 w-14 shrink-0 rounded-none object-cover"
                        />
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-ink">
                          {selectedGame.name}
                        </p>
                        <p className="mt-0.5 text-xs text-ink/55">
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
                <SelectFormField
                  label="Age category"
                  value={form.ageCategory}
                  onChange={(e) =>
                    patchForm(
                      'ageCategory',
                      e.target.value as EventFormState['ageCategory'],
                    )
                  }
                >
                  {AGE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </SelectFormField>
                <div className="sm:col-span-2">
                  <TextAreaFormField
                    label="Description"
                    rows={3}
                    placeholder="Tell players what to expect…"
                    value={form.description}
                    onChange={(e) => patchForm('description', e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2" data-event-field="venue">
                  <PlaceAutocompleteField
                    label="Venue"
                    required
                    placeholder="Search stadium, school, sports complex…"
                    value={form.venue}
                    error={fieldErrors.venue}
                    onChange={(venue) => patchForm('venue', venue)}
                    onPlaceSelect={applyPlaceToForm}
                    hint="Pick a place to auto-fill venue and eligibility zone when possible"
                  />
                </div>
              </div>
            </FormSection>

            <FormSection
              title="Schedule"
              description="Event times and registration window"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div data-event-field="startsAt">
                  <TextFormField
                    label="Starts at"
                    type="datetime-local"
                    required
                    value={form.startsAt}
                    error={fieldErrors.startsAt}
                    onChange={(e) => patchForm('startsAt', e.target.value)}
                  />
                </div>
                <div data-event-field="endsAt">
                  <TextFormField
                    label="Ends at"
                    type="datetime-local"
                    value={form.endsAt}
                    error={fieldErrors.endsAt}
                    onChange={(e) => patchForm('endsAt', e.target.value)}
                    hint={
                      <p className="mt-1 text-xs text-ink/45">Optional</p>
                    }
                  />
                </div>
                <div data-event-field="registrationOpensAt">
                  <TextFormField
                    label="Registration opens"
                    type="datetime-local"
                    required
                    value={form.registrationOpensAt}
                    error={fieldErrors.registrationOpensAt}
                    onChange={(e) =>
                      patchForm('registrationOpensAt', e.target.value)
                    }
                  />
                </div>
                <div data-event-field="registrationClosesAt">
                  <TextFormField
                    label="Registration closes"
                    type="datetime-local"
                    required
                    value={form.registrationClosesAt}
                    error={fieldErrors.registrationClosesAt}
                    onChange={(e) =>
                      patchForm('registrationClosesAt', e.target.value)
                    }
                  />
                </div>
              </div>
            </FormSection>

            <FormSection
              title="Capacity & fee"
              description="Seats, pricing, and chess pairing settings"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div data-event-field="maxParticipants">
                  <TextFormField
                    label="Max participants"
                    type="number"
                    min={1}
                    required
                    value={form.maxParticipants}
                    error={fieldErrors.maxParticipants}
                    onChange={(e) =>
                      patchForm('maxParticipants', e.target.value)
                    }
                  />
                </div>
                <div data-event-field="fee">
                  <TextFormField
                    label="Entry fee (₹)"
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.fee}
                    error={fieldErrors.fee}
                    onChange={(e) => patchForm('fee', e.target.value)}
                  />
                </div>
                {selectedGame?.name === 'Chess' ? (
                  <>
                    <div data-event-field="boardCount">
                      <TextFormField
                        label="Chess boards"
                        type="number"
                        min={1}
                        required
                        value={form.boardCount}
                        error={fieldErrors.boardCount}
                        onChange={(e) =>
                          patchForm('boardCount', e.target.value)
                        }
                        hint={
                          <p className="mt-1 text-xs text-ink/45">
                            Boards available at the venue
                          </p>
                        }
                      />
                    </div>
                    <div data-event-field="gamesPerPlayer">
                      <TextFormField
                        label="Games per player"
                        type="number"
                        min={1}
                        value={form.gamesPerPlayer}
                        error={fieldErrors.gamesPerPlayer}
                        onChange={(e) =>
                          patchForm('gamesPerPlayer', e.target.value)
                        }
                        hint={
                          <p className="mt-1 text-xs text-ink/45">
                            Games each player must complete
                          </p>
                        }
                      />
                    </div>
                  </>
                ) : null}
              </div>
            </FormSection>

            <FormSection
              title="Eligibility"
              description="Leave zone empty for nationwide; leave genders empty for all"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div data-event-field="state">
                  <SelectFormField
                    label="State"
                    value={form.state}
                    error={fieldErrors.state}
                    onChange={(e) => patchForm('state', e.target.value)}
                  >
                    <option value="">Nationwide</option>
                    {states.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </SelectFormField>
                </div>
                <div data-event-field="district">
                  <SelectFormField
                    label="District"
                    value={form.district}
                    error={fieldErrors.district}
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
                  </SelectFormField>
                </div>
                <div className="sm:col-span-2">
                  <FieldLabel>Eligible genders</FieldLabel>
                  <div className="mt-1.5 flex flex-wrap gap-4">
                    {EVENT_GENDERS.map((g) => (
                      <CheckboxField
                        key={g}
                        label={g.replaceAll('_', ' ')}
                        checked={form.genders.includes(g)}
                        onChange={() => toggleGender(g)}
                      />
                    ))}
                  </div>
                  <p className="mt-1.5 text-xs text-ink/45">
                    Empty selection means all genders can register
                  </p>
                </div>
              </div>
            </FormSection>

            <FormSection
              title="Audience"
              description="Optional targeting for schools and organisers"
            >
              <div className="grid gap-4">
                <div data-event-field="schoolIds">
                  <FieldLabel>Target schools</FieldLabel>
                  {fieldErrors.schoolIds ? (
                    <p
                      className="mt-1 text-[13px] font-medium text-red-600"
                      role="alert"
                    >
                      {fieldErrors.schoolIds}
                    </p>
                  ) : null}
                  <div className="mt-1.5">
                    <MultiSelectDropdown
                      options={schoolOptions}
                      value={form.schoolIds}
                      onChange={(schoolIds) =>
                        patchForm('schoolIds', schoolIds)
                      }
                      placeholder="All eligible schools"
                      emptyMessage="No schools available"
                      aria-invalid={fieldErrors.schoolIds ? true : undefined}
                      aria-label="Target schools"
                    />
                  </div>
                </div>

                <div data-event-field="organizerIds">
                  <FieldLabel>Assign organisers</FieldLabel>
                  {fieldErrors.organizerIds ? (
                    <p
                      className="mt-1 text-[13px] font-medium text-red-600"
                      role="alert"
                    >
                      {fieldErrors.organizerIds}
                    </p>
                  ) : null}
                  <div className="mt-1.5">
                    <MultiSelectDropdown
                      options={organizerOptions}
                      value={form.organizerIds}
                      onChange={(organizerIds) =>
                        patchForm('organizerIds', organizerIds)
                      }
                      placeholder="Select organisers"
                      emptyMessage="No organisers yet — invite them from Organisers."
                      aria-invalid={
                        fieldErrors.organizerIds ? true : undefined
                      }
                      aria-label="Assign organisers"
                    />
                  </div>
                </div>
              </div>
            </FormSection>

            <div className="flex justify-end gap-3 border-t border-line pt-5">
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate('/admin/events')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving…' : 'Save draft'}
              </Button>
            </div>
          </form>
        </GlassPanel>

        <aside className="xl:sticky xl:top-24">
          <EventMobilePreview
            form={form}
            gameName={selectedGame?.name}
            gameImageUrl={selectedGame?.imageUrl}
          />
        </aside>
      </div>
    </div>
  )
}
