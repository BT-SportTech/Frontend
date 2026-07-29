import { NavLink, Outlet } from 'react-router-dom'
import { AdminHeaderSearch } from '../components/admin/AdminHeaderSearch'
import { Button } from '../components/ui'
import { selectUser, useAuthStore } from '../stores/useAuthStore'
import adminBackground from '../assets/background.png'

const nav = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/schools', label: 'Schools' },
  { to: '/admin/users', label: 'Users' },
]

export function AdminLayout() {
  const user = useAuthStore(selectUser)
  const logout = useAuthStore((state) => state.logout)

  return (
    <div className="relative flex min-h-full">
      <img
        src={adminBackground}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="pointer-events-none absolute inset-0 bg-white/25" />

      <aside className="glass sticky top-0 z-10 flex h-screen w-60 shrink-0 flex-col border-r border-white/60 px-4 py-6">
        <div className="px-2">
          <p className="font-display text-xl font-bold tracking-tight text-primary">
            SportTech
          </p>
          <p className="mt-0.5 text-xs font-semibold uppercase tracking-[0.12em] text-secondary">
            Admin
          </p>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-ink/65 hover:bg-white hover:text-primary'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-line/80 pt-4">
          <p className="truncate px-2 text-sm font-semibold text-ink">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="truncate px-2 text-xs text-ink/50">{user?.email}</p>
          <Button
            variant="ghost"
            className="mt-3 w-full"
            onClick={() => void logout()}
          >
            Sign out
          </Button>
        </div>
      </aside>

      <main className="relative z-10 flex min-w-0 flex-1 flex-col">
        <header className="glass sticky top-0 z-10 border-b border-white/60 px-6 py-3.5 backdrop-blur-xl">
          <div className="flex items-center gap-6">
            <p className="shrink-0 text-sm font-medium text-ink/55">
              SportTech Admin Console
            </p>
            <div className="ml-auto w-1/2 min-w-0">
              <AdminHeaderSearch />
            </div>
          </div>
        </header>
        <div className="animate-fade-in flex-1 p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
