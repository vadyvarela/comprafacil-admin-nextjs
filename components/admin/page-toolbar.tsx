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
    <div className={cn("border-b border-border bg-background/60 backdrop-blur-sm sticky top-14 z-30", className)}>
      <div className="px-5 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg shrink-0", iconBg)}>
              <Icon className={cn("h-4.5 w-4.5", iconColor)} />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-foreground">{title}</h1>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
              )}
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
