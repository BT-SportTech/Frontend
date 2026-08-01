import { api } from '../api'
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
