import type { EventFormState } from './eventForm'

type ApiErrorBody = {
  message?: string | string[]
  field?: string
  code?: string
}

export class ApiError extends Error {
  fieldErrors: Partial<Record<string, string>>
  code?: string

  constructor(
    message: string,
    fieldErrors: Partial<Record<string, string>> = {},
    code?: string,
  ) {
    super(message)
    this.name = 'ApiError'
    this.fieldErrors = fieldErrors
    this.code = code
  }
}

const EVENT_FIELD_KEYS = new Set<string>([
  'name',
  'gameId',
  'description',
  'venue',
  'startsAt',
  'endsAt',
  'registrationOpensAt',
  'registrationClosesAt',
  'maxParticipants',
  'state',
  'district',
  'ageCategory',
  'fee',
  'boardCount',
  'gamesPerPlayer',
  'schoolIds',
  'organizerIds',
])

function isEventFieldKey(key: string): key is keyof EventFormState {
  return EVENT_FIELD_KEYS.has(key)
}

function mapMessageToField(message: string): keyof EventFormState | null {
  const lower = message.toLowerCase()

  if (lower.startsWith('name ') || lower.includes('name must')) return 'name'
  if (lower.startsWith('venue ') || lower.includes('venue must')) return 'venue'
  if (
    lower.startsWith('gameid') ||
    lower.includes('invalid or inactive game')
  ) {
    return 'gameId'
  }
  if (lower.includes('registration close must')) return 'registrationClosesAt'
  if (lower.includes('registration must close')) return 'registrationClosesAt'
  if (lower.includes('registration open')) return 'registrationOpensAt'
  if (lower.includes('event end')) return 'endsAt'
  if (lower.includes('event start') || lower.includes('invalid date')) {
    return 'startsAt'
  }
  if (lower.includes('boardcount') || lower.includes('chess events')) {
    return 'boardCount'
  }
  if (lower.includes('state and district') || lower.includes('zone')) {
    return 'state'
  }
  if (lower.includes('school ids')) return 'schoolIds'
  if (lower.includes('organizer ids')) return 'organizerIds'
  if (lower.includes('maxparticipants')) return 'maxParticipants'
  if (lower.startsWith('fee ')) return 'fee'

  const propertyPrefix = /^([a-zA-Z]+)\s/.exec(message)
  if (propertyPrefix && isEventFieldKey(propertyPrefix[1])) {
    return propertyPrefix[1]
  }

  return null
}

export function parseApiErrorBody(
  status: number,
  body: ApiErrorBody,
): ApiError {
  const messages = Array.isArray(body.message)
    ? body.message
    : body.message
      ? [body.message]
      : [`Request failed (${status})`]

  const fieldErrors: Partial<Record<keyof EventFormState, string>> = {}

  if (body.field && isEventFieldKey(body.field)) {
    fieldErrors[body.field] = messages[0]
  }

  for (const message of messages) {
    const field = mapMessageToField(message)
    if (field && !fieldErrors[field]) {
      fieldErrors[field] = message
    }
    if (
      message.toLowerCase().includes('state and district') &&
      !fieldErrors.district
    ) {
      fieldErrors.district = message
    }
  }

  return new ApiError(messages.join(', '), fieldErrors, body.code)
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError
}
