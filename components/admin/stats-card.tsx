import { type LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

type AccentColor = "emerald" | "blue" | "violet" | "amber" | "rose" | "indigo" | "cyan"

interface StatsCardProps {
  label: string
  value: string
  delta?: string
  trend?: "up" | "down" | "neutral"
  icon: LucideIcon
  accentColor: AccentColor
  period?: string
  href?: string
  className?: string
}

const accentMap: Record<AccentColor, { icon: string; bg: string; dot: string }> = {
  emerald: {
    icon: "text-success-strong",
    bg: "bg-success-soft",
    dot: "bg-success",
  },
  blue: {
    icon: "text-info-strong",
    bg: "bg-info-soft",
    dot: "bg-info",
  },
  violet: {
    icon: "text-highlight-strong",
    bg: "bg-highlight-soft",
    dot: "bg-highlight",
  },
  amber: {
    icon: "text-warning-strong",
    bg: "bg-warning-soft",
    dot: "bg-warning",
  },
  rose: {
    icon: "text-danger-strong",
    bg: "bg-danger-soft",
    dot: "bg-danger",
  },
  indigo: {
    icon: "text-info-strong",
    bg: "bg-info-soft",
    dot: "bg-info",
  },
  cyan: {
    icon: "text-info-strong",
    bg: "bg-info-soft",
    dot: "bg-info",
  },
}

export function StatsCard({
  label,
  value,
  delta,
  trend = "neutral",
  icon: Icon,
  accentColor,
  period = "vs período anterior",
  className,
}: StatsCardProps) {
  const accent = accentMap[accentColor]

  return (
    <div
      className={cn(
        "group rounded-lg border border-border/80 bg-card p-4 shadow-xs transition-colors",
        "hover:border-border hover:bg-muted/20",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", accent.dot)} aria-hidden />
            <span className="text-[11px] font-semibold uppercase text-muted-foreground">
              {label}
            </span>
          </div>
          <p className="text-xl font-semibold tabular-nums text-foreground leading-none">
            {value}
          </p>
          {delta && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {trend === "up" && <TrendingUp className="h-3 w-3 text-success" />}
              {trend === "down" && <TrendingDown className="h-3 w-3 text-danger" />}
              {trend === "neutral" && <Minus className="h-3 w-3 text-muted-foreground" />}
              <span
                className={cn(
                  "text-xs font-medium",
                  trend === "up" && "text-success-strong",
                  trend === "down" && "text-danger-strong",
                  trend === "neutral" && "text-muted-foreground"
                )}
              >
                {delta}
              </span>
              <span className="text-xs text-muted-foreground">{period}</span>
            </div>
          )}
          {!delta && period && (
            <p className="text-xs text-muted-foreground">{period}</p>
          )}
        </div>
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border/60",
            accent.bg
          )}
        >
          <Icon className={cn("h-4 w-4", accent.icon)} />
        </div>
      </div>
    </div>
  )
}
