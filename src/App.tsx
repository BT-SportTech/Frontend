import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { AdminLayout } from './layouts/AdminLayout'
import { DashboardPage } from './pages/admin/DashboardPage'
import { EventsPage } from './pages/admin/EventsPage'
import { GamesPage } from './pages/admin/GamesPage'
import { SchoolsPage } from './pages/admin/SchoolsPage'
import { UsersPage } from './pages/admin/UsersPage'
import { LoginPage } from './pages/LoginPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="schools" element={<SchoolsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="games" element={<GamesPage />} />
            <Route path="events" element={<EventsPage />} />
          </Route>
        </Route>
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
