import type { AuthUser } from '../lib/types'

export interface AuthStoreState {
  user: AuthUser | null
}

export interface AuthStoreActions {
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export type AuthStore = AuthStoreState & AuthStoreActions

export interface LoginFormValues {
  email: string
  password: string
}

export interface LoginFieldErrors {
  email?: string
  password?: string
}
