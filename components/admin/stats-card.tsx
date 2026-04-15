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

const accentMap: Record<AccentColor, { icon: string; bg: string; border: string }> = {
  emerald: {
    icon: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-l-emerald-500",
  },
  blue: {
    icon: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-l-blue-500",
  },
  violet: {
    icon: "text-violet-400",
    bg: "bg-violet-400/10",
    border: "border-l-violet-500",
  },
  amber: {
    icon: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-l-amber-500",
  },
  rose: {
    icon: "text-rose-400",
    bg: "bg-rose-400/10",
    border: "border-l-rose-500",
  },
  indigo: {
    icon: "text-indigo-400",
    bg: "bg-indigo-400/10",
    border: "border-l-indigo-500",
  },
  cyan: {
    icon: "text-cyan-400",
    bg: "bg-cyan-400/10",
    border: "border-l-cyan-500",
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
        "rounded-xl border border-border bg-card p-5 border-l-4 transition-all duration-200",
        "hover:shadow-md hover:border-border/80 hover:bg-card/90",
        accent.border,
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground font-medium">{label}</span>
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", accent.bg)}>
          <Icon className={cn("h-4 w-4", accent.icon)} />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground font-mono leading-none">
          {value}
        </p>
        {delta && (
          <div className="flex items-center gap-1.5">
            {trend === "up" && <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />}
            {trend === "down" && <TrendingDown className="h-3.5 w-3.5 text-rose-400" />}
            {trend === "neutral" && <Minus className="h-3.5 w-3.5 text-muted-foreground" />}
            <span
              className={cn(
                "text-xs font-medium",
                trend === "up" && "text-emerald-400",
                trend === "down" && "text-rose-400",
                trend === "neutral" && "text-muted-foreground"
              )}
            >
              {delta}
            </span>
            <span className="text-xs text-muted-foreground">{period}</span>
          </div>
        )}
      </div>
    </div>
  )
}
