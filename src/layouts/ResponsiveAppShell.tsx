import {
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Button } from '../components/ui'
import { selectUser, useAuthStore } from '../stores/useAuthStore'

export type AppNavItem = {
  to: string
  label: string
  end?: boolean
  icon: ReactNode
}

type ResponsiveAppShellProps = {
  sidebarStorageKey: string
  brandTitle: string
  brandSubtitle: string
  brandShort: string
  mobileHeaderTitle: string
  navItems: AppNavItem[]
  header?: ReactNode
  afterMain?: ReactNode
  rootClassName?: string
}

function MenuIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden
    >
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  )
}

function CollapseIcon({ collapsed }: { collapsed: boolean }) {
  return (
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
  )
}

function SignOutIcon() {
  return (
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
  )
}

function SidebarContent({
  collapsed,
  onToggleCollapse,
  onNavigate,
  brandTitle,
  brandSubtitle,
  brandShort,
  navItems,
  showCollapseToggle,
}: {
  collapsed: boolean
  onToggleCollapse?: () => void
  onNavigate?: () => void
  brandTitle: string
  brandSubtitle: string
  brandShort: string
  navItems: AppNavItem[]
  showCollapseToggle: boolean
}) {
  const user = useAuthStore(selectUser)
  const logout = useAuthStore((state) => state.logout)

  return (
    <>
      <div
        className={`flex items-start ${collapsed ? 'flex-col items-center gap-3' : 'justify-between gap-2 px-2'}`}
      >
        <div className={collapsed ? 'text-center' : undefined}>
          {collapsed ? (
            <p className="font-display text-lg font-bold tracking-tight text-primary">
              {brandShort}
            </p>
          ) : (
            <>
              <p className="font-display text-xl font-bold tracking-tight text-primary">
                {brandTitle}
              </p>
              <p className="mt-0.5 text-xs font-semibold uppercase tracking-[0.12em] text-secondary">
                {brandSubtitle}
              </p>
            </>
          )}
        </div>
        {showCollapseToggle && onToggleCollapse ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink/55 transition hover:bg-white hover:text-primary"
          >
            <CollapseIcon collapsed={collapsed} />
          </button>
        ) : null}
      </div>

      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            title={item.label}
            onClick={onNavigate}
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

      <div className={`border-t border-line/80 pt-4 ${collapsed ? 'px-0' : ''}`}>
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
          {collapsed ? <SignOutIcon /> : 'Sign out'}
        </Button>
      </div>
    </>
  )
}

export function ResponsiveAppShell({
  sidebarStorageKey,
  brandTitle,
  brandSubtitle,
  brandShort,
  mobileHeaderTitle,
  navItems,
  header,
  afterMain,
  rootClassName = 'relative flex min-h-dvh bg-bg',
}: ResponsiveAppShellProps) {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(sidebarStorageKey) === '1'
    } catch {
      return false
    }
  })
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(sidebarStorageKey, collapsed ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [collapsed, sidebarStorageKey])

  useEffect(() => {
    setMobileNavOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!mobileNavOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileNavOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mobileNavOpen])

  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileNavOpen])

  return (
    <div className={rootClassName}>
      <aside
        className={`glass sticky top-0 z-20 hidden h-dvh shrink-0 flex-col border-r border-line py-6 transition-[width] duration-300 ease-out lg:flex ${
          collapsed ? 'w-[4.75rem] px-2.5' : 'w-60 px-4'
        }`}
      >
        <SidebarContent
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((value) => !value)}
          brandTitle={brandTitle}
          brandSubtitle={brandSubtitle}
          brandShort={brandShort}
          navItems={navItems}
          showCollapseToggle
        />
      </aside>

      {mobileNavOpen ? (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-ink/40 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <aside
        id="mobile-app-nav"
        aria-hidden={!mobileNavOpen}
        className={`glass fixed inset-y-0 left-0 z-50 flex w-[min(100vw-3rem,18rem)] flex-col border-r border-line px-4 py-6 transition-transform duration-300 ease-out lg:hidden ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent
          collapsed={false}
          onNavigate={() => setMobileNavOpen(false)}
          brandTitle={brandTitle}
          brandSubtitle={brandSubtitle}
          brandShort={brandShort}
          navItems={navItems}
          showCollapseToggle={false}
        />
      </aside>

      <main className="relative z-10 flex min-w-0 flex-1 flex-col">
        <header className="glass sticky top-0 z-30 border-b border-line px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex min-h-11 items-center gap-3 lg:hidden">
            <button
              type="button"
              aria-expanded={mobileNavOpen}
              aria-controls="mobile-app-nav"
              aria-label="Open navigation menu"
              onClick={() => setMobileNavOpen(true)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-ink/70 transition hover:text-primary"
            >
              <MenuIcon />
            </button>
            <p className="min-w-0 truncate text-base font-semibold text-ink/70">
              {mobileHeaderTitle}
            </p>
          </div>
          {header ? <div className="pt-3 lg:pt-0">{header}</div> : null}
        </header>
        <div className="animate-fade-in flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <Outlet />
        </div>
      </main>
      {afterMain}
    </div>
  )
}
