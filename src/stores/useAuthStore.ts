import { create } from 'zustand'
import { api, clearTokens, getAccessToken, getRefreshToken, setTokens } from '../lib/api'
import type { AuthResponse, AuthUser } from '../lib/types'
import type { AuthStore } from '../interfaces'

const USER_KEY = 'sporttech_user'

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

    if (data.user.role !== 'ADMIN') {
      throw new Error('Access denied. Admin accounts only.')
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

export const selectUser = (state: AuthStore) => state.user
