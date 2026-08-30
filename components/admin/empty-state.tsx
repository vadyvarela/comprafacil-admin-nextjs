import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type EmptyStateTone = "neutral" | "info" | "success" | "warning" | "danger"

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
  tone?: EmptyStateTone
}

const toneClasses: Record<EmptyStateTone, { icon: string; iconWrap: string }> = {
  neutral: {
    icon: "text-muted-foreground/55",
    iconWrap: "bg-muted/45",
  },
  info: {
    icon: "text-blue-700",
    iconWrap: "bg-blue-50",
  },
  success: {
    icon: "text-emerald-700",
    iconWrap: "bg-emerald-50",
  },
  warning: {
    icon: "text-amber-800",
    iconWrap: "bg-amber-50",
  },
  danger: {
    icon: "text-destructive",
    iconWrap: "bg-destructive/10",
  },
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  tone = "neutral",
}: EmptyStateProps) {
  const toneClass = toneClasses[tone]

  return (
    <div
      className={cn(
        "mx-auto flex max-w-sm flex-col items-center justify-center px-4 py-16 text-center",
        className
      )}
    >
      <div
        className={cn(
          "mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-border/80",
          toneClass.iconWrap
        )}
      >
        <Icon className={cn("h-6 w-6", toneClass.icon)} />
      </div>
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {description ? (
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-4 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  )
}
