export type AdminSearchTab = 'schools' | 'users' | 'events'

export interface AdminSearchStoreState {
  schools: string
  users: string
  events: string
}

export interface AdminSearchStoreActions {
  setSearch: (tab: AdminSearchTab, value: string) => void
  clearSearch: (tab: AdminSearchTab) => void
}

export type AdminSearchStore = AdminSearchStoreState & AdminSearchStoreActions
