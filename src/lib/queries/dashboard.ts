import { api } from '../api'
import { SCHOOL_TYPES } from '../../interfaces/school.interface'
import type { Paginated, SchoolListItem, SchoolType } from '../types'

export interface DashboardStats {
  schoolsActive: number
  schoolsInactive: number
  usersTotal: number
  players: number
  professionals: number
  byType: Record<SchoolType, number>
  recentSchools: SchoolListItem[]
}

export const dashboardKeys = {
  all: ['dashboard'] as const,
}

const emptyByType = Object.fromEntries(
  SCHOOL_TYPES.map((type) => [type, 0]),
) as Record<SchoolType, number>

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const [
    schoolsActive,
    schoolsInactive,
    usersTotal,
    players,
    professionals,
    recent,
    ...typeCounts
  ] = await Promise.all([
    api<Paginated<SchoolListItem>>('/schools?page=1&limit=1'),
    api<Paginated<SchoolListItem>>('/schools?page=1&limit=1&isActive=false'),
    api<Paginated<unknown>>('/users?page=1&limit=1'),
    api<Paginated<unknown>>('/users?page=1&limit=1&role=PLAYER'),
    api<Paginated<unknown>>('/users?page=1&limit=1&role=PROFESSIONAL'),
    api<Paginated<SchoolListItem>>('/schools?page=1&limit=5'),
    ...SCHOOL_TYPES.map((type) =>
      api<Paginated<SchoolListItem>>(`/schools?page=1&limit=1&type=${type}`),
    ),
  ])

  const byType = { ...emptyByType }
  SCHOOL_TYPES.forEach((type, index) => {
    byType[type] = typeCounts[index]?.meta.total ?? 0
  })

  return {
    schoolsActive: schoolsActive.meta.total,
    schoolsInactive: schoolsInactive.meta.total,
    usersTotal: usersTotal.meta.total,
    players: players.meta.total,
    professionals: professionals.meta.total,
    byType,
    recentSchools: recent.data,
  }
}
