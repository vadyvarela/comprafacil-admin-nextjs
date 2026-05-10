import { type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface PageToolbarProps {
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  title: string
  subtitle?: string
  children?: React.ReactNode
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
        "border-b border-border bg-muted/30 sticky top-12 z-30",
        className
      )}
    >
      <div className="px-4 py-2.5 md:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md border border-border/60 shrink-0 bg-card",
                iconBg
              )}
            >
              <Icon className={cn("h-4 w-4", iconColor)} />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-foreground">{title}</h1>
              {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {children && (
            <div className="flex items-center gap-2">{children}</div>
          )}
        </div>
      </div>
    </div>
  )
}
