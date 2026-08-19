import { LogOut, Menu, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PageBreadcrumbs } from "./PageBreadcrumbs"
import type { BreadcrumbItem } from "@/hooks/useRouteMeta"
import { selectUser, useAuthStore } from "@/stores/useAuthStore"

type AppTopBarProps = {
  mobileTitle: string
  breadcrumbs: BreadcrumbItem[]
  onOpenMobileNav: () => void
  mobileNavOpen: boolean
  trailing?: React.ReactNode
}

export function AppTopBar({
  mobileTitle,
  breadcrumbs,
  onOpenMobileNav,
  mobileNavOpen,
  trailing,
}: AppTopBarProps) {
  const user = useAuthStore(selectUser)
  const logout = useAuthStore((s) => s.logout)

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-card/95 backdrop-blur-sm">
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Button
          variant="outline"
          size="icon"
          className="lg:hidden"
          onClick={onOpenMobileNav}
          aria-expanded={mobileNavOpen}
          aria-label="Open navigation menu"
        >
          <Menu className="h-4 w-4" />
        </Button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-ink lg:hidden">
            {mobileTitle}
          </p>
          <PageBreadcrumbs items={breadcrumbs} />
        </div>

        {trailing ? (
          <div className="hidden items-center gap-2 lg:flex">{trailing}</div>
        ) : null}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-full">
              <User className="h-4 w-4" />
              <span className="sr-only">User menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <p className="font-semibold text-ink">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => void logout()}
              className="text-red-600 focus:text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {trailing ? (
        <div className="flex items-center gap-2 border-t border-line px-4 py-2 lg:hidden">
          {trailing}
        </div>
      ) : null}
    </header>
  )
}
