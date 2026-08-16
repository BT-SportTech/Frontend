import { z } from 'zod'
import type { EventFormState } from '../lib/eventForm'

const positiveIntString = (label: string, min = 1) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .refine((v) => /^\d+$/.test(v), `${label} must be a whole number`)
    .refine((v) => parseInt(v, 10) >= min, `${label} must be at least ${min}`)

const nonNegativeIntString = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .refine((v) => /^\d+$/.test(v), `${label} must be a whole number`)
    .refine((v) => parseInt(v, 10) >= 0, `${label} cannot be negative`)

const datetimeLocal = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .refine((v) => !Number.isNaN(new Date(v).getTime()), `Enter a valid ${label.toLowerCase()}`)

export function buildEventFormSchema(isChess: boolean) {
  return z
    .object({
      name: z.string().trim().min(2, 'Event name must be at least 2 characters'),
      gameId: z.string().trim().min(1, 'Select a game'),
      description: z.string(),
      venue: z.string().trim().min(2, 'Venue must be at least 2 characters'),
      startsAt: datetimeLocal('Start date'),
      endsAt: z.string(),
      registrationOpensAt: datetimeLocal('Registration open date'),
      registrationClosesAt: datetimeLocal('Registration close date'),
      maxParticipants: positiveIntString('Max participants'),
      state: z.string(),
      district: z.string(),
      ageCategory: z.string(),
      genders: z.array(z.string()),
      schoolIds: z.array(z.string()),
      organizerIds: z.array(z.string()),
      fee: nonNegativeIntString('Fee'),
      boardCount: isChess
        ? positiveIntString('Board count')
        : z.string(),
      gamesPerPlayer: isChess
        ? positiveIntString('Games per player')
        : z.string(),
      imageUrl: z.string(),
      imageFile: z.custom<File | null>(),
    })
    .superRefine((data, ctx) => {
      const startsAt = new Date(data.startsAt)
      const opensAt = new Date(data.registrationOpensAt)
      const closesAt = new Date(data.registrationClosesAt)

      if (closesAt < opensAt) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Registration close must be after registration open.',
          path: ['registrationClosesAt'],
        })
      }
      if (closesAt > startsAt) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Registration must close on or before the event start.',
          path: ['registrationClosesAt'],
        })
      }
      if (data.endsAt.trim()) {
        const endsAt = new Date(data.endsAt)
        if (Number.isNaN(endsAt.getTime()) || endsAt < startsAt) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Event end must be after event start.',
            path: ['endsAt'],
          })
        }
      }

      const hasState = Boolean(data.state.trim())
      const hasDistrict = Boolean(data.district.trim())
      if (hasState !== hasDistrict) {
        const message =
          'Set both state and district for a zone, or leave both empty for nationwide.'
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message,
          path: ['state'],
        })
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message,
          path: ['district'],
        })
      }
    })
}

export function parseEventFieldErrors(
  error: z.ZodError,
): Partial<Record<keyof EventFormState, string>> {
  const out: Partial<Record<keyof EventFormState, string>> = {}
  for (const issue of error.issues) {
    const key = issue.path[0]
    if (typeof key === 'string' && !out[key as keyof EventFormState]) {
      out[key as keyof EventFormState] = issue.message
    }
  }
  return out
}
