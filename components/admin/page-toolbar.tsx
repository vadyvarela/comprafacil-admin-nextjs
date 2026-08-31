import type { ReactNode } from "react"
import { type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface PageToolbarProps {
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  title: string
  /** Texto simples ou conteúdo composto (ex.: badge de estado). */
  subtitle?: ReactNode
  children?: ReactNode
  className?: string
}

export function PageToolbar({
  icon: Icon,
  iconColor = "text-primary",
  iconBg = "bg-primary/10",
  title,
  subtitle,
  children,
  className,
}: PageToolbarProps) {
  return (
    <div
      className={cn(
        "sticky top-12 z-30 border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85",
        className
      )}
    >
      <div className="px-4 py-3 md:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-2.5">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md border border-border/60 shrink-0 bg-card",
                iconBg
              )}
            >
              <Icon className={cn("h-4 w-4", iconColor)} />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground">{title}</h1>
              {subtitle != null && subtitle !== "" ? (
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                  {subtitle}
                </div>
              ) : null}
            </div>
          </div>
          {children && (
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">{children}</div>
          )}
        </div>
      </div>
    </div>
  )
}
