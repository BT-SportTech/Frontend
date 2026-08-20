import type { ReactNode } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type FilterBarProps = {
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  children?: ReactNode
  className?: string
}

export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search…",
  children,
  className,
}: FilterBarProps) {
  return (
    <div className={cn("mb-4 flex flex-col gap-3 sm:flex-row sm:items-center", className)}>
      {onSearchChange ? (
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchValue ?? ""}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9"
          />
        </div>
      ) : null}
      {children ? (
        <div className="flex flex-wrap items-center gap-2">{children}</div>
      ) : null}
    </div>
  )
}
