import { Navigate, Outlet, useLocation } from 'react-router-dom'
import {
  selectIsAdmin,
  selectIsAuthenticated,
  useAuthStore,
} from '../stores/useAuthStore'

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  const isAdmin = useAuthStore(selectIsAdmin)
  const location = useLocation()

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
