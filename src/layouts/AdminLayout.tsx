import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { AdminHeaderSearch } from '../components/admin/AdminHeaderSearch'
import { ThemeColorPicker } from '../components/admin/ThemeColorPicker'
import { Button } from '../components/ui'
import { selectUser, useAuthStore } from '../stores/useAuthStore'
import adminBackground from '../assets/background.png'

const SIDEBAR_KEY = 'sporttech_admin_sidebar_collapsed'

const nav = [
  {
    to: '/admin',
    label: 'Dashboard',
    end: true,
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5 shrink-0"
        aria-hidden
      >
        <rect width="7" height="9" x="3" y="3" rx="1" />
        <rect width="7" height="5" x="14" y="3" rx="1" />
        <rect width="7" height="9" x="14" y="12" rx="1" />
        <rect width="7" height="5" x="3" y="16" rx="1" />
      </svg>
    ),
  },
  {
    to: '/admin/schools',
    label: 'Schools',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5 shrink-0"
        aria-hidden
      >
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ),
  },
  {
    to: '/admin/events',
    label: 'Events',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5 shrink-0"
        aria-hidden
      >
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <rect width="18" height="18" x="3" y="4" rx="2" />
        <path d="M3 10h18" />
        <path d="m9 16 2 2 4-4" />
      </svg>
    ),
  },
]

export function AdminLayout() {
  const user = useAuthStore(selectUser)
  const logout = useAuthStore((state) => state.logout)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_KEY) === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [collapsed])

  return (
    <div className="relative flex min-h-full">
      <img
        src={adminBackground}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="theme-morphism-wash pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 bg-white/20" />

      <aside
        className={`glass sticky top-0 z-10 flex h-screen shrink-0 flex-col border-r border-white/60 py-6 transition-[width] duration-300 ease-out ${
          collapsed ? 'w-[4.75rem] px-2.5' : 'w-60 px-4'
        }`}
      >
        <div
          className={`flex items-start ${collapsed ? 'flex-col items-center gap-3' : 'justify-between gap-2 px-2'}`}
        >
          <div className={collapsed ? 'text-center' : undefined}>
            {collapsed ? (
              <p className="font-display text-lg font-bold tracking-tight text-primary">
                ST
              </p>
            ) : (
              <>
                <p className="font-display text-xl font-bold tracking-tight text-primary">
                  SportTech
                </p>
                <p className="mt-0.5 text-xs font-semibold uppercase tracking-[0.12em] text-secondary">
                  Admin
                </p>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink/55 transition hover:bg-white hover:text-primary"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`h-4 w-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
              aria-hidden
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={item.label}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg py-2.5 text-sm font-semibold transition ${
                  collapsed ? 'justify-center px-0' : 'px-3'
                } ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-ink/65 hover:bg-white hover:text-primary'
                }`
              }
            >
              {item.icon}
              {!collapsed ? <span>{item.label}</span> : null}
            </NavLink>
          ))}
        </nav>

        <div
          className={`border-t border-line/80 pt-4 ${collapsed ? 'px-0' : ''}`}
        >
          {!collapsed ? (
            <>
              <p className="truncate px-2 text-sm font-semibold text-ink">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="truncate px-2 text-xs text-ink/50">{user?.email}</p>
            </>
          ) : null}
          <Button
            variant="ghost"
            className={`mt-3 ${collapsed ? 'w-full !px-0' : 'w-full'}`}
            onClick={() => void logout()}
            title="Sign out"
            aria-label="Sign out"
          >
            {collapsed ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" x2="9" y1="12" y2="12" />
              </svg>
            ) : (
              'Sign out'
            )}
          </Button>
        </div>
      </aside>

      <main className="relative z-10 flex min-w-0 flex-1 flex-col">
        <header className="glass sticky top-0 z-10 border-b border-white/60 px-6 py-5 backdrop-blur-xl lg:px-8">
          <div className="flex min-h-12 items-center gap-4 lg:gap-6">
            <p className="shrink-0 text-base font-semibold text-ink/60">
              SportTech Admin Console
            </p>
            <div className="ml-auto w-1/2 min-w-0">
              <AdminHeaderSearch />
            </div>
            <ThemeColorPicker />
          </div>
        </header>
        <div className="animate-fade-in flex-1 p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
