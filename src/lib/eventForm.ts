import type { AgeCategory, EventPayload, Gender, SportEvent } from '../lib/types'

export const EVENT_SPORTS = [
  'Football',
  'Badminton',
  'Cricket',
  'Athletics',
  'Basketball',
  'Tennis',
] as const

export const AGE_CATEGORIES: AgeCategory[] = [
  'U12',
  'U14',
  'U16',
  'U18',
  'OPEN',
]

export const EVENT_GENDERS: Gender[] = [
  'MALE',
  'FEMALE',
  'OTHER',
  'PREFER_NOT_TO_SAY',
]

export type EventFormState = {
  name: string
  sport: string
  description: string
  venue: string
  startsAt: string
  endsAt: string
  registrationOpensAt: string
  registrationClosesAt: string
  maxParticipants: string
  state: string
  district: string
  ageCategory: AgeCategory
  genders: Gender[]
  schoolIds: string[]
  fee: string
  pointsReward: string
}

function toLocalInputValue(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromLocalInputValue(local: string): string {
  const d = new Date(local)
  return d.toISOString()
}

function defaultStarts(): Date {
  const d = new Date()
  d.setDate(d.getDate() + 14)
  d.setHours(10, 0, 0, 0)
  return d
}

export function emptyEventForm(): EventFormState {
  const starts = defaultStarts()
  const opens = new Date()
  opens.setHours(0, 0, 0, 0)
  const closes = new Date(starts)
  closes.setDate(closes.getDate() - 1)
  closes.setHours(23, 59, 0, 0)

  return {
    name: '',
    sport: 'Football',
    description: '',
    venue: '',
    startsAt: toLocalInputValue(starts),
    endsAt: '',
    registrationOpensAt: toLocalInputValue(opens),
    registrationClosesAt: toLocalInputValue(closes),
    maxParticipants: '40',
    state: '',
    district: '',
    ageCategory: 'U16',
    genders: [],
    schoolIds: [],
    fee: '0',
    pointsReward: '50',
  }
}

export function eventToForm(event: SportEvent): EventFormState {
  return {
    name: event.name,
    sport: event.sport,
    description: event.description ?? '',
    venue: event.venue,
    startsAt: toLocalInputValue(event.startsAt),
    endsAt: event.endsAt ? toLocalInputValue(event.endsAt) : '',
    registrationOpensAt: toLocalInputValue(event.registrationOpensAt),
    registrationClosesAt: toLocalInputValue(event.registrationClosesAt),
    maxParticipants: String(event.maxParticipants),
    state: event.state,
    district: event.district,
    ageCategory: event.ageCategory,
    genders: [...event.genders],
    schoolIds: [...event.schoolIds],
    fee: String(event.fee),
    pointsReward: String(event.pointsReward),
  }
}

export function formToEventPayload(form: EventFormState): EventPayload {
  return {
    name: form.name.trim(),
    sport: form.sport.trim(),
    description: form.description.trim() || undefined,
    venue: form.venue.trim(),
    startsAt: fromLocalInputValue(form.startsAt),
    endsAt: form.endsAt.trim()
      ? fromLocalInputValue(form.endsAt)
      : undefined,
    registrationOpensAt: fromLocalInputValue(form.registrationOpensAt),
    registrationClosesAt: fromLocalInputValue(form.registrationClosesAt),
    maxParticipants: Math.max(1, parseInt(form.maxParticipants, 10) || 1),
    state: form.state,
    district: form.district,
    ageCategory: form.ageCategory,
    genders: form.genders,
    schoolIds: form.schoolIds,
    fee: Math.max(0, parseFloat(form.fee) || 0),
    pointsReward: Math.max(0, parseInt(form.pointsReward, 10) || 0),
  }
}
