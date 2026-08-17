import { api, uploadSchoolLogo } from '../api'
import type { Paginated, School, SchoolListItem } from '../types'
import type { SchoolFormState } from '../../interfaces/school.interface'
import { formToSchoolPayload } from '../schoolForm'

export type SchoolsListParams = {
  page: number
  limit: number
  search?: string
}

export const schoolsKeys = {
  all: ['schools'] as const,
  lists: () => [...schoolsKeys.all, 'list'] as const,
  list: (params: SchoolsListParams) => [...schoolsKeys.lists(), params] as const,
  details: () => [...schoolsKeys.all, 'detail'] as const,
  detail: (id: string) => [...schoolsKeys.details(), id] as const,
}

export async function fetchSchools(
  params: SchoolsListParams,
): Promise<Paginated<SchoolListItem>> {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  })
  if (params.search) searchParams.set('search', params.search)

  return api<Paginated<SchoolListItem>>(`/schools?${searchParams.toString()}`)
}

export async function fetchSchool(id: string): Promise<School> {
  return api<School>(`/schools/${id}`)
}

export type SaveSchoolInput = {
  editingId: string | null
  form: SchoolFormState
}

export async function fetchSchoolsByName(
  name: string,
): Promise<SchoolListItem[]> {
  const trimmed = name.trim()
  if (!trimmed) return []

  const result = await fetchSchools({ page: 1, limit: 50, search: trimmed })
  const normalized = trimmed.toLowerCase()
  return result.data.filter(
    (school) => school.name.trim().toLowerCase() === normalized,
  )
}

export async function saveSchool({
  editingId,
  form,
}: SaveSchoolInput): Promise<School> {
  let logoUrl = form.logoUrl.trim()
  if (form.logoFile) {
    const uploaded = await uploadSchoolLogo(form.logoFile)
    logoUrl = uploaded.url
  }

  const payload = {
    ...formToSchoolPayload(form),
    logoUrl: logoUrl || undefined,
  }

  if (editingId) {
    return api<School>(`/schools/${editingId}`, {
      method: 'PATCH',
      body: payload,
    })
  }

  return api<School>('/schools', { method: 'POST', body: payload })
}

export async function deactivateSchool(id: string): Promise<void> {
  await api(`/schools/${id}`, { method: 'DELETE' })
}
