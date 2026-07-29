import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api, clearTokens, getAccessToken, getRefreshToken, setTokens } from '../lib/api'
import type { AuthResponse, AuthUser } from '../lib/types'

const USER_KEY = 'sporttech_user'

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (!getAccessToken()) return null
    return readStoredUser()
  })

  const login = useCallback(async (email: string, password: string) => {
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
    setUser(data.user)
  }, [])

  const logout = useCallback(async () => {
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
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user && getAccessToken()),
      isAdmin: user?.role === 'ADMIN',
      login,
      logout,
    }),
    [user, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
