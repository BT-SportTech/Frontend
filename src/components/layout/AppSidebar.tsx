import { NavLink } from "react-router-dom"
import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export type NavItem = {
  to: string
  label: string
  end?: boolean
  icon: React.ReactNode
}

export type NavGroup = {
  label?: string
  items: NavItem[]
}

type AppSidebarProps = {
  brandTitle: string
  roleLabel: string
  brandShort: string
  groups: NavGroup[]
  collapsed: boolean
  onToggleCollapse?: () => void
  onNavigate?: () => void
  showCollapseToggle?: boolean
}

export function AppSidebar({
  brandTitle,
  roleLabel,
  brandShort,
  groups,
  collapsed,
  onToggleCollapse,
  onNavigate,
  showCollapseToggle = false,
}: AppSidebarProps) {
  return (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          "flex items-start",
          collapsed ? "flex-col items-center gap-3" : "justify-between gap-2 px-1",
        )}
      >
        <div className={collapsed ? "text-center" : undefined}>
          {collapsed ? (
            <p className="text-lg font-bold text-primary">{brandShort}</p>
          ) : (
            <>
              <p className="text-xl font-bold tracking-tight text-primary">
                {brandTitle}
              </p>
              <span className="mt-1 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                {roleLabel}
              </span>
            </>
          )}
        </div>
        {showCollapseToggle && onToggleCollapse ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="shrink-0"
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform",
                collapsed && "rotate-180",
              )}
            />
          </Button>
        ) : null}
      </div>

      <nav className="mt-6 flex-1 space-y-6">
        {groups.map((group, gi) => (
          <div key={group.label ?? gi}>
            {!collapsed && group.label ? (
              <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </p>
            ) : null}
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    title={item.label}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        "relative flex items-center gap-3 rounded-lg py-2.5 text-sm font-semibold transition-colors",
                        collapsed ? "justify-center px-0" : "px-3",
                        isActive
                          ? "bg-primary/10 text-primary before:absolute before:left-0 before:top-1/2 before:h-5 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-primary"
                          : "text-ink/65 hover:bg-muted hover:text-ink",
                      )
                    }
                  >
                    {item.icon}
                    {!collapsed ? <span>{item.label}</span> : null}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {showCollapseToggle ? (
        <>
          <Separator className="my-4" />
          <p className="text-center text-[10px] text-muted-foreground">
            {collapsed ? "ST" : "Sportech"}
          </p>
        </>
      ) : null}
    </div>
  )
}
