import { create } from 'zustand'
import type { AdminSearchStore, AdminSearchTab } from '../interfaces'

export const useAdminSearchStore = create<AdminSearchStore>((set) => ({
  schools: '',
  events: '',

  setSearch: (tab, value) => set({ [tab]: value }),

  clearSearch: (tab) => set({ [tab]: '' }),
}))

export const selectTabSearch =
  (tab: AdminSearchTab) => (state: AdminSearchStore) => state[tab]
