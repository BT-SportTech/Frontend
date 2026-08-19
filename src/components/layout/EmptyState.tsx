import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type EmptyStateProps = {
  icon?: ReactNode
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        {icon ? (
          <div className="mb-3 text-muted-foreground">{icon}</div>
        ) : null}
        <p className="font-semibold text-ink">{title}</p>
        {description ? (
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
        {actionLabel && onAction ? (
          <Button className="mt-4" onClick={onAction}>{actionLabel}</Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
