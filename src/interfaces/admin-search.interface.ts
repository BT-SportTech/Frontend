export type AdminSearchTab = 'schools' | 'events' | 'players'

export interface AdminSearchStoreState {
  schools: string
  events: string
  players: string
}

export interface AdminSearchStoreActions {
  setSearch: (tab: AdminSearchTab, value: string) => void
  clearSearch: (tab: AdminSearchTab) => void
}

export type AdminSearchStore = AdminSearchStoreState & AdminSearchStoreActions
