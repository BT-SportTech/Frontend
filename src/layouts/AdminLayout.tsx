import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/ui'

const nav = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/schools', label: 'Schools' },
  { to: '/admin/users', label: 'Users' },
]

export function AdminLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="app-backdrop flex min-h-full">
      <aside className="glass sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-white/40 px-4 py-6">
        <div className="px-2">
          <p className="font-display text-xl font-bold tracking-tight text-primary">
            SportTech
          </p>
          <p className="mt-0.5 text-xs font-medium text-ink/45">Admin</p>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-ink/70 hover:bg-white/50 hover:text-ink'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-line/60 pt-4">
          <p className="truncate px-2 text-sm font-medium text-ink">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="truncate px-2 text-xs text-ink/45">{user?.email}</p>
          <Button
            variant="ghost"
            className="mt-3 w-full"
            onClick={() => void logout()}
          >
            Sign out
          </Button>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="glass sticky top-0 z-10 border-b border-white/40 px-6 py-4 backdrop-blur-xl">
          <p className="text-sm font-medium text-ink/55">SportTech Admin Console</p>
        </header>
        <div className="animate-fade-in flex-1 p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
