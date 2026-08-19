import { useEffect, useState, type ReactNode } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { AppSidebar, type NavGroup } from "@/components/layout/AppSidebar"
import { AppTopBar } from "@/components/layout/AppTopBar"
import { ContentContainer } from "@/components/layout/ContentContainer"
import { Toaster } from "@/components/ui/sonner"
import { useRouteMeta } from "@/hooks/useRouteMeta"
import { cn } from "@/lib/utils"

type AppShellProps = {
  sidebarStorageKey: string
  brandTitle: string
  roleLabel: string
  brandShort: string
  navGroups: NavGroup[]
  topBarTrailing?: ReactNode
}

export function AppShell({
  sidebarStorageKey,
  brandTitle,
  roleLabel,
  brandShort,
  navGroups,
  topBarTrailing,
}: AppShellProps) {
  const location = useLocation()
  const { title, breadcrumbs, contentWidth } = useRouteMeta()

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(sidebarStorageKey) === "1"
    } catch {
      return false
    }
  })
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(sidebarStorageKey, collapsed ? "1" : "0")
    } catch {
      /* ignore */
    }
  }, [collapsed, sidebarStorageKey])

  useEffect(() => {
    setMobileNavOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [mobileNavOpen])

  return (
    <div className="flex min-h-dvh bg-muted/30">
      <aside
        className={cn(
          "sticky top-0 z-20 hidden h-dvh shrink-0 flex-col border-r border-line bg-sidebar py-5 transition-[width] duration-300 lg:flex",
          collapsed ? "w-[4.5rem] px-2" : "w-64 px-4",
        )}
      >
        <AppSidebar
          brandTitle={brandTitle}
          roleLabel={roleLabel}
          brandShort={brandShort}
          groups={navGroups}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((v) => !v)}
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
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[min(100vw-3rem,18rem)] flex-col border-r border-line bg-sidebar px-4 py-5 transition-transform duration-300 lg:hidden",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <AppSidebar
          brandTitle={brandTitle}
          roleLabel={roleLabel}
          brandShort={brandShort}
          groups={navGroups}
          collapsed={false}
          onNavigate={() => setMobileNavOpen(false)}
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopBar
          mobileTitle={title}
          breadcrumbs={breadcrumbs}
          onOpenMobileNav={() => setMobileNavOpen(true)}
          mobileNavOpen={mobileNavOpen}
          trailing={topBarTrailing}
        />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <ContentContainer width={contentWidth}>
            <Outlet />
          </ContentContainer>
        </main>
      </div>

      <Toaster position="top-right" richColors closeButton />
    </div>
  )
}
