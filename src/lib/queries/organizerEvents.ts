import { api } from '../api'
import type { SportEvent } from '../types'
import type { EventRegistrationRow, MatchOutcome } from './events'

export const organizerEventsKeys = {
  all: ['organizer-events'] as const,
  mine: () => [...organizerEventsKeys.all, 'mine'] as const,
  history: () => [...organizerEventsKeys.all, 'history'] as const,
  detail: (id: string) => [...organizerEventsKeys.all, 'detail', id] as const,
  registrations: (id: string) =>
    [...organizerEventsKeys.all, 'registrations', id] as const,
}

export type OrganizerEventSummary = {
  id: string
  name: string
  venue: string
  startsAt: string
  status: string
  state?: string | null
  district?: string | null
  imageUrl?: string | null
  attendanceWindowOpen?: boolean
  attendanceOpensAt?: string
  sport?: string
}

export type OrganizerRegistrationsResponse = {
  eventId: string
  data: (EventRegistrationRow & {
    attendedAt: string | null
    attendedById: string | null
    attendedBy?: {
      id: string
      firstName: string
      lastName: string
    } | null
  })[]
  attendanceWindowOpen: boolean
  attendanceOpensAt: string
}

export async function fetchOrganizerEvents(): Promise<{
  data: OrganizerEventSummary[]
}> {
  return api('/events/organizer/mine')
}

export async function fetchOrganizerHistory(): Promise<{
  data: OrganizerEventSummary[]
  meta: { total: number }
}> {
  return api('/events/organizer/history')
}

export const fetchOrganizerEventHistory = fetchOrganizerHistory

export async function fetchOrganizerEvent(id: string): Promise<SportEvent> {
  return api(`/events/${id}`)
}

export async function fetchOrganizerRegistrations(
  eventId: string,
): Promise<OrganizerRegistrationsResponse> {
  return api(`/events/${eventId}/registrations`)
}

export async function setRegistrationAttendance(
  eventId: string,
  registrationId: string,
  attended: boolean,
): Promise<OrganizerRegistrationsResponse['data'][number]> {
  return api(`/events/${eventId}/registrations/${registrationId}/attendance`, {
    method: 'PATCH',
    body: { attended },
  })
}

export type { MatchOutcome }
