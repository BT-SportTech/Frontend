export type AdminSearchTab = 'schools' | 'users'

export interface AdminSearchStoreState {
  schools: string
  users: string
}

export interface AdminSearchStoreActions {
  setSearch: (tab: AdminSearchTab, value: string) => void
  clearSearch: (tab: AdminSearchTab) => void
}

export type AdminSearchStore = AdminSearchStoreState & AdminSearchStoreActions
