import { api, uploadEventImage } from '../api'
import { formToEventPayload, type EventFormState } from '../eventForm'
import type { EventPayload, Paginated, SportEvent } from '../types'

export type EventsListParams = {
  page: number
  limit: number
  search?: string
  status?: string
}

export const eventsKeys = {
  all: ['events'] as const,
  lists: () => [...eventsKeys.all, 'list'] as const,
  list: (params: EventsListParams) => [...eventsKeys.lists(), params] as const,
  details: () => [...eventsKeys.all, 'detail'] as const,
  detail: (id: string) => [...eventsKeys.details(), id] as const,
}

export async function fetchEvents(
  params: EventsListParams,
): Promise<Paginated<SportEvent>> {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  })
  if (params.search) searchParams.set('search', params.search)
  if (params.status) searchParams.set('status', params.status)

  return api<Paginated<SportEvent>>(`/events?${searchParams.toString()}`)
}

export async function fetchEvent(id: string): Promise<SportEvent> {
  return api<SportEvent>(`/events/${id}`)
}

export type SaveEventInput = {
  editingId: string | null
  form: EventFormState
}

export async function saveEvent({
  editingId,
  form,
}: SaveEventInput): Promise<SportEvent> {
  let imageUrl = form.imageUrl.trim()
  if (form.imageFile) {
    const uploaded = await uploadEventImage(form.imageFile)
    imageUrl = uploaded.url
  }

  const payload: EventPayload = {
    ...formToEventPayload(form),
    imageUrl: imageUrl || null,
  }

  if (editingId) return updateEvent(editingId, payload)
  return createEvent(payload)
}

export async function createEvent(payload: EventPayload): Promise<SportEvent> {
  return api<SportEvent>('/events', { method: 'POST', body: payload })
}

export async function updateEvent(
  id: string,
  payload: Partial<EventPayload>,
): Promise<SportEvent> {
  return api<SportEvent>(`/events/${id}`, { method: 'PATCH', body: payload })
}

export async function publishEvent(id: string): Promise<SportEvent> {
  return api<SportEvent>(`/events/${id}/publish`, { method: 'POST' })
}

export async function completeEvent(id: string): Promise<SportEvent> {
  return api<SportEvent>(`/events/${id}/complete`, { method: 'POST' })
}

export async function cancelEvent(id: string): Promise<SportEvent> {
  return api<SportEvent>(`/events/${id}/cancel`, { method: 'POST' })
}

export type MatchOutcome = 'WIN' | 'LOSS' | 'DRAW'

export type EventRegistrationRow = {
  id: string
  userId: string
  status: string
  outcome: MatchOutcome | null
  pointsEarned: number
  registeredAt: string
  user: {
    id: string
    firstName: string
    lastName: string
    username: string
    email: string | null
  }
}

export async function fetchEventRegistrations(eventId: string): Promise<{
  eventId: string
  data: EventRegistrationRow[]
}> {
  return api(`/events/${eventId}/registrations`)
}

export async function submitEventResults(
  eventId: string,
  results: { userId: string; outcome: MatchOutcome }[],
): Promise<{ eventId: string; data: EventRegistrationRow[] }> {
  return api(`/events/${eventId}/results`, {
    method: 'POST',
    body: { results },
  })
}
