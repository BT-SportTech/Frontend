import { z } from 'zod'
import type { LoginFormValues } from '../interfaces'

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
}) satisfies z.ZodType<LoginFormValues>

export type LoginSchema = z.infer<typeof loginSchema>

export function parseLoginFieldErrors(
  error: z.ZodError<LoginFormValues>,
): Partial<Record<keyof LoginFormValues, string>> {
  const flattened = error.flatten().fieldErrors
  return {
    email: flattened.email?.[0],
    password: flattened.password?.[0],
  }
}
