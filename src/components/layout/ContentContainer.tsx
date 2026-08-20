import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import type { ContentWidth } from "@/hooks/useRouteMeta"

type ContentContainerProps = {
  children: ReactNode
  width?: ContentWidth
  className?: string
}

const widthClass: Record<ContentWidth, string> = {
  constrained: "max-w-7xl",
  wide: "max-w-[90rem]",
  full: "max-w-none",
}

export function ContentContainer({
  children,
  width = "constrained",
  className,
}: ContentContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full animate-fade-in",
        widthClass[width],
        className,
      )}
    >
      {children}
    </div>
  )
}
