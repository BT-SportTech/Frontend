import type { AgeCategory, EventPayload, Gender } from '../lib/types'

export const AGE_CATEGORIES: AgeCategory[] = [
  'U12',
  'U14',
  'U16',
  'U18',
  'OPEN',
]

/** Fixed catalog shown in the admin event create dropdown. */
export const ADMIN_EVENT_GAMES = [
  'Chess',
  'Table Tennis',
  'Tennis',
  'Badminton',
  'Football',
] as const


export const EVENT_GENDERS: Gender[] = [
  'MALE',
  'FEMALE',
  'OTHER',
  'PREFER_NOT_TO_SAY',
]

export type EventFormState = {
  name: string
  gameId: string
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
  organizerIds: string[]
  fee: string
  pointsReward: string
  boardCount: string
  gamesPerPlayer: string
  imageUrl: string
  imageFile: File | null
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
    gameId: '',
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
    organizerIds: [],
    fee: '0',
    pointsReward: '50',
    boardCount: '10',
    gamesPerPlayer: '3',
    imageUrl: '',
    imageFile: null,
  }
}

export function formToEventPayload(form: EventFormState): EventPayload {
  const boardCount = Math.max(1, parseInt(form.boardCount, 10) || 1)
  const gamesPerPlayer = Math.max(1, parseInt(form.gamesPerPlayer, 10) || 3)

  return {
    name: form.name.trim(),
    gameId: form.gameId,
    description: form.description.trim() || undefined,
    venue: form.venue.trim(),
    startsAt: fromLocalInputValue(form.startsAt),
    endsAt: form.endsAt.trim()
      ? fromLocalInputValue(form.endsAt)
      : undefined,
    registrationOpensAt: fromLocalInputValue(form.registrationOpensAt),
    registrationClosesAt: fromLocalInputValue(form.registrationClosesAt),
    maxParticipants: Math.max(1, parseInt(form.maxParticipants, 10) || 1),
    state: form.state.trim() || undefined,
    district: form.district.trim() || undefined,
    ageCategory: form.ageCategory,
    genders: form.genders,
    schoolIds: form.schoolIds,
    organizerIds: form.organizerIds,
    fee: Math.max(0, parseFloat(form.fee) || 0),
    pointsReward: Math.max(0, parseInt(form.pointsReward, 10) || 0),
    boardCount,
    gamesPerPlayer,
    imageUrl: form.imageUrl.trim() || null,
  }
}
