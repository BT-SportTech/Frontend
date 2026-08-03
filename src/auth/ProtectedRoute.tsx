import { Navigate, Outlet, useLocation } from 'react-router-dom'
import {
  selectIsAdmin,
  selectIsAuthenticated,
  selectIsOrganizer,
  useAuthStore,
} from '../stores/useAuthStore'

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  const isAdmin = useAuthStore(selectIsAdmin)
  const isOrganizer = useAuthStore(selectIsOrganizer)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (isAdmin || isOrganizer) {
    return <Outlet />
  }

  return <Navigate to="/login" replace state={{ from: location }} />
}

export function AdminRoute() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  const isAdmin = useAuthStore(selectIsAdmin)
  const isOrganizer = useAuthStore(selectIsOrganizer)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (!isAdmin) {
    if (isOrganizer) return <Navigate to="/organizer" replace />
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export function OrganizerRoute() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  const isAdmin = useAuthStore(selectIsAdmin)
  const isOrganizer = useAuthStore(selectIsOrganizer)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (!isOrganizer) {
    if (isAdmin) return <Navigate to="/admin" replace />
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
