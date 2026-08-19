import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import {
  AdminRoute,
  OrganizerRoute,
  ProtectedRoute,
} from './auth/ProtectedRoute'
import { AdminLayout } from './layouts/AdminLayout'
import { OrganizerLayout } from './layouts/OrganizerLayout'
import { DashboardPage } from './pages/admin/DashboardPage'
import { EventCreatePage } from './pages/admin/EventCreatePage'
import { EventDetailPage } from './pages/admin/EventDetailPage'
import { EventsPage } from './pages/admin/EventsPage'
import { OrganizersPage } from './pages/admin/OrganizersPage'
import { PlayerDetailPage } from './pages/admin/PlayerDetailPage'
import { PlayersPage } from './pages/admin/PlayersPage'
import { SchoolDetailPage } from './pages/admin/SchoolDetailPage'
import { SchoolCreatePage } from './pages/admin/SchoolCreatePage'
import { SchoolEditPage } from './pages/admin/SchoolEditPage'
import { SchoolsPage } from './pages/admin/SchoolsPage'
import { AcceptInvitePage } from './pages/AcceptInvitePage'
import { LoginPage } from './pages/LoginPage'
import { OrganizerEventDetailPage } from './pages/organizer/OrganizerEventDetailPage'
import { OrganizerEventsPage } from './pages/organizer/OrganizerEventsPage'
import { OrganizerHistoryPage } from './pages/organizer/OrganizerHistoryPage'
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

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/invite/:token',
    element: <AcceptInvitePage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AdminRoute />,
        children: [
          {
            path: '/admin',
            element: <AdminLayout />,
            handle: { title: 'Dashboard', breadcrumb: 'Dashboard' },
            children: [
              { index: true, element: <DashboardPage /> },
              {
                path: 'schools',
                element: <SchoolsPage />,
                handle: { title: 'Schools', breadcrumb: 'Schools' },
              },
              {
                path: 'schools/new',
                element: <SchoolCreatePage />,
                handle: { title: 'New school', breadcrumb: 'New' },
              },
              {
                path: 'schools/:id/edit',
                element: <SchoolEditPage />,
                handle: { title: 'Edit school', breadcrumb: 'Edit' },
              },
              {
                path: 'schools/:id',
                element: <SchoolDetailPage />,
                handle: { title: 'School', breadcrumb: 'Detail' },
              },
              {
                path: 'events',
                element: <EventsPage />,
                handle: { title: 'Events', breadcrumb: 'Events' },
              },
              {
                path: 'events/new',
                element: <EventCreatePage />,
                handle: { title: 'New event', breadcrumb: 'New' },
              },
              {
                path: 'events/:id',
                element: <EventDetailPage />,
                handle: { title: 'Event', breadcrumb: 'Detail' },
              },
              {
                path: 'players',
                handle: {
                  title: 'Players',
                  breadcrumb: 'Players',
                  contentWidth: 'wide',
                },
                children: [
                  { index: true, element: <PlayersPage /> },
                  {
                    path: ':id',
                    element: <PlayerDetailPage />,
                    handle: { title: 'Player', breadcrumb: 'Profile' },
                  },
                ],
              },
              {
                path: 'organizers',
                element: <OrganizersPage />,
                handle: { title: 'Organisers', breadcrumb: 'Organisers' },
              },
            ],
          },
        ],
      },
      {
        element: <OrganizerRoute />,
        children: [
          {
            path: '/organizer',
            element: <OrganizerLayout />,
            handle: { title: 'My events', breadcrumb: 'My events' },
            children: [
              { index: true, element: <OrganizerEventsPage /> },
              {
                path: 'history',
                element: <OrganizerHistoryPage />,
                handle: { title: 'History', breadcrumb: 'History' },
              },
              {
                path: 'events/:id',
                element: <OrganizerEventDetailPage />,
                handle: {
                  title: 'Check-in',
                  breadcrumb: 'Event',
                  contentWidth: 'full',
                },
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '/',
    element: <HomeRedirect />,
  },
  {
    path: '*',
    element: <HomeRedirect />,
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
