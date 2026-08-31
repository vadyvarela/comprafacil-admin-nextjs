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
    icon: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-50",
    dot: "bg-emerald-500",
  },
  blue: {
    icon: "text-blue-700 dark:text-blue-300",
    bg: "bg-blue-50",
    dot: "bg-blue-500",
  },
  violet: {
    icon: "text-violet-700 dark:text-violet-300",
    bg: "bg-violet-50",
    dot: "bg-violet-500",
  },
  amber: {
    icon: "text-amber-800 dark:text-amber-300",
    bg: "bg-amber-50",
    dot: "bg-amber-500",
  },
  rose: {
    icon: "text-rose-700 dark:text-rose-300",
    bg: "bg-rose-50",
    dot: "bg-rose-500",
  },
  indigo: {
    icon: "text-indigo-700 dark:text-indigo-300",
    bg: "bg-indigo-50",
    dot: "bg-indigo-500",
  },
  cyan: {
    icon: "text-cyan-800 dark:text-cyan-300",
    bg: "bg-cyan-50",
    dot: "bg-cyan-500",
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
            <span className="text-[10px] font-semibold uppercase text-muted-foreground">
              {label}
            </span>
          </div>
          <p className="text-xl font-semibold tabular-nums text-foreground leading-none">
            {value}
          </p>
          {delta && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {trend === "up" && <TrendingUp className="h-3 w-3 text-emerald-600" />}
              {trend === "down" && <TrendingDown className="h-3 w-3 text-rose-600" />}
              {trend === "neutral" && <Minus className="h-3 w-3 text-muted-foreground" />}
              <span
                className={cn(
                  "text-[11px] font-medium",
                  trend === "up" && "text-emerald-700",
                  trend === "down" && "text-rose-700",
                  trend === "neutral" && "text-muted-foreground"
                )}
              >
                {delta}
              </span>
              <span className="text-[11px] text-muted-foreground">{period}</span>
            </div>
          )}
          {!delta && period && (
            <p className="text-[11px] text-muted-foreground">{period}</p>
          )}
        </div>
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border/60",
            accent.bg,
            "dark:bg-muted/60"
          )}
        >
          <Icon className={cn("h-4 w-4", accent.icon)} />
        </div>
      </div>
    </div>
  )
}
