import type { SchoolListItem } from './types'

export type SchoolLocationFields = {
  city?: string | null
  district?: string | null
  state?: string | null
  pincode?: string | null
}

function normalizeKey(value?: string | null): string {
  return (value ?? '').trim().toLowerCase()
}

export function formatSchoolLocation(school: SchoolLocationFields): string {
  const parts = [school.city, school.district, school.state, school.pincode]
    .map((part) => part?.trim())
    .filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : '—'
}

export function locationKeysMatch(
  a: SchoolLocationFields,
  b: SchoolLocationFields,
): boolean {
  return (
    normalizeKey(a.city) === normalizeKey(b.city) &&
    normalizeKey(a.district) === normalizeKey(b.district) &&
    normalizeKey(a.state) === normalizeKey(b.state) &&
    normalizeKey(a.pincode) === normalizeKey(b.pincode)
  )
}

export function findMatchingCampus(
  form: SchoolLocationFields,
  campuses: SchoolListItem[],
): SchoolListItem | undefined {
  return campuses.find((campus) => locationKeysMatch(form, campus))
}
