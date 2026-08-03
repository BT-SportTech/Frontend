import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import {
  AdminRoute,
  OrganizerRoute,
  ProtectedRoute,
} from './auth/ProtectedRoute'
import { AdminLayout } from './layouts/AdminLayout'
import { OrganizerLayout } from './layouts/OrganizerLayout'
import { DashboardPage } from './pages/admin/DashboardPage'
import { EventDetailPage } from './pages/admin/EventDetailPage'
import { EventsPage } from './pages/admin/EventsPage'
import { OrganizersPage } from './pages/admin/OrganizersPage'
import { SchoolsPage } from './pages/admin/SchoolsPage'
import { AcceptInvitePage } from './pages/AcceptInvitePage'
import { LoginPage } from './pages/LoginPage'
import { OrganizerEventDetailPage } from './pages/organizer/OrganizerEventDetailPage'
import { OrganizerEventsPage } from './pages/organizer/OrganizerEventsPage'
import {
  selectIsAdmin,
  selectIsAuthenticated,
  selectIsOrganizer,
  useAuthStore,
} from './stores/useAuthStore'

function HomeRedirect() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  const isAdmin = useAuthStore(selectIsAdmin)
  const isOrganizer = useAuthStore(selectIsOrganizer)

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (isOrganizer) return <Navigate to="/organizer" replace />
  if (isAdmin) return <Navigate to="/admin" replace />
  return <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/invite/:token" element={<AcceptInvitePage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="schools" element={<SchoolsPage />} />
              <Route path="events" element={<EventsPage />} />
              <Route path="events/:id" element={<EventDetailPage />} />
              <Route path="organizers" element={<OrganizersPage />} />
            </Route>
          </Route>

          <Route element={<OrganizerRoute />}>
            <Route path="/organizer" element={<OrganizerLayout />}>
              <Route index element={<OrganizerEventsPage />} />
              <Route path="events/:id" element={<OrganizerEventDetailPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="/" element={<HomeRedirect />} />
        <Route path="*" element={<HomeRedirect />} />
      </Routes>
    </BrowserRouter>
  )
}
