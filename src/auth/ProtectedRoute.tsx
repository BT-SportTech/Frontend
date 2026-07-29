import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

export function ProtectedRoute() {
  const { isAuthenticated, isAdmin } = useAuth()
  const location = useLocation()

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
