import { api } from '../api'
import type { Paginated, UserListItem } from '../types'

export type UsersListParams = {
  page: number
  limit: number
  search?: string
}

export const usersKeys = {
  all: ['users'] as const,
  lists: () => [...usersKeys.all, 'list'] as const,
  list: (params: UsersListParams) => [...usersKeys.lists(), params] as const,
}

export async function fetchUsers(
  params: UsersListParams,
): Promise<Paginated<UserListItem>> {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  })
  if (params.search) searchParams.set('search', params.search)

  return api<Paginated<UserListItem>>(`/users?${searchParams.toString()}`)
}
