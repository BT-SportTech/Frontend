import { create } from 'zustand'
import { api, clearTokens, getAccessToken, getRefreshToken, setTokens } from '../lib/api'
import type { AuthResponse, AuthUser, UserRole } from '../lib/types'
import type { AuthStore } from '../interfaces'

const USER_KEY = 'Sportech_user'
const WEB_ROLES: UserRole[] = ['ADMIN', 'ORGANIZER']

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

function initializeUser(): AuthUser | null {
  if (!getAccessToken()) return null
  return readStoredUser()
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: initializeUser(),

  login: async (email, password) => {
    const data = await api<AuthResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false,
    })

    if (!WEB_ROLES.includes(data.user.role)) {
      throw new Error('Access denied. Admin or organizer accounts only.')
    }

    setTokens(data.accessToken, data.refreshToken)
    localStorage.setItem(USER_KEY, JSON.stringify(data.user))
    set({ user: data.user })
  },

  acceptInviteSession: (data: AuthResponse) => {
    if (data.user.role !== 'ORGANIZER') {
      throw new Error('Invite acceptance did not return an organizer account.')
    }
    setTokens(data.accessToken, data.refreshToken)
    localStorage.setItem(USER_KEY, JSON.stringify(data.user))
    set({ user: data.user })
  },

  logout: async () => {
    const refreshToken = getRefreshToken()
    try {
      if (refreshToken) {
        await api('/auth/logout', {
          method: 'POST',
          body: { refreshToken },
        })
      }
    } catch {
      /* ignore logout errors */
    } finally {
      clearTokens()
      localStorage.removeItem(USER_KEY)
      set({ user: null })
    }
  },
}))

export const selectIsAuthenticated = (state: AuthStore) =>
  Boolean(state.user && getAccessToken())

export const selectIsAdmin = (state: AuthStore) => state.user?.role === 'ADMIN'

export const selectIsOrganizer = (state: AuthStore) =>
  state.user?.role === 'ORGANIZER'

export const selectUser = (state: AuthStore) => state.user
