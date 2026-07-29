import { Navigate } from 'react-router-dom'
import { LoginBrandSection, LoginForm } from '../components/login'
import {
  selectIsAdmin,
  selectIsAuthenticated,
  useAuthStore,
} from '../stores/useAuthStore'

export function LoginPage() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  const isAdmin = useAuthStore(selectIsAdmin)

  if (isAuthenticated && isAdmin) {
    return <Navigate to="/admin" replace />
  }

  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      <LoginBrandSection />
      <LoginForm />
    </div>
  )
}
