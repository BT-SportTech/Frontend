import type { SportsInstructorMember } from './types'

export type SportsInstructorFormRow = {
  name: string
  phone: string
}

export function emptySportsInstructorRow(): SportsInstructorFormRow {
  return { name: '', phone: '' }
}

export function normalizeSportsInstructorsForForm(
  instructors?: SportsInstructorMember[] | null,
): SportsInstructorFormRow[] {
  if (!instructors?.length) return [emptySportsInstructorRow()]
  return instructors.map((item) => ({
    name: item.name?.trim() ?? '',
    phone: item.phone?.trim() ?? '',
  }))
}

export function serializeSportsInstructors(
  instructors: SportsInstructorFormRow[],
): SportsInstructorMember[] | undefined {
  const items = instructors
    .map((item) => ({
      name: item.name.trim() || undefined,
      phone: item.phone.trim() || undefined,
    }))
    .filter((item) => item.name || item.phone)
  return items.length > 0 ? items : undefined
}
