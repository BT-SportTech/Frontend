import { api } from '../api'
import type { RankTier } from '../rankTier'
import type {
  Paginated,
  PlayerDetail,
  PlayerMatchRow,
  PlayerRegistrationRow,
  PlayerStats,
  UserListItem,
  UserRole,
} from '../types'

export type UsersListParams = {
  page: number
  limit: number
  search?: string
  role?: UserRole
  state?: string
  city?: string
  rank?: RankTier
}

export const usersKeys = {
  all: ['users'] as const,
  lists: () => [...usersKeys.all, 'list'] as const,
  list: (params: UsersListParams) => [...usersKeys.lists(), params] as const,
  details: () => [...usersKeys.all, 'detail'] as const,
  detail: (id: string) => [...usersKeys.details(), id] as const,
  stats: (id: string) => [...usersKeys.all, 'stats', id] as const,
  registrations: (id: string, params: { page: number; limit: number }) =>
    [...usersKeys.all, 'registrations', id, params] as const,
  matches: (id: string, params: { page: number; limit: number }) =>
    [...usersKeys.all, 'matches', id, params] as const,
}

export async function fetchUsers(
  params: UsersListParams,
): Promise<Paginated<UserListItem>> {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  })
  if (params.search) searchParams.set('search', params.search)
  if (params.role) searchParams.set('role', params.role)
  if (params.state) searchParams.set('state', params.state)
  if (params.city) searchParams.set('city', params.city)
  if (params.rank) searchParams.set('rank', params.rank)

  return api<Paginated<UserListItem>>(`/users?${searchParams.toString()}`)
}

export async function fetchPlayer(id: string): Promise<PlayerDetail> {
  return api<PlayerDetail>(`/users/${id}`)
}

export async function fetchPlayerStats(id: string): Promise<PlayerStats> {
  return api<PlayerStats>(`/users/${id}/stats`)
}

export async function fetchPlayerRegistrations(
  id: string,
  params: { page: number; limit: number },
): Promise<Paginated<PlayerRegistrationRow>> {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  })
  return api<Paginated<PlayerRegistrationRow>>(
    `/users/${id}/registrations?${searchParams.toString()}`,
  )
}

export async function fetchPlayerMatches(
  id: string,
  params: { page: number; limit: number },
): Promise<Paginated<PlayerMatchRow>> {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  })
  return api<Paginated<PlayerMatchRow>>(
    `/users/${id}/matches?${searchParams.toString()}`,
  )
}
