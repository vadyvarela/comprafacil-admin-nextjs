import {
  AlarmClock,
  CircleDollarSign,
  Headphones,
  PhoneMissed,
  Sparkles,
  Users,
} from "lucide-react"
import type { CommercialRecoveryLeadMetrics } from "@/lib/graphql/commercial-leads/types"
import { formatCurrency, minorToMajorCurrencyAmount } from "@/lib/utils/currency"
import { cn } from "@/lib/utils"

type CommercialLeadMetricsProps = {
  metrics: CommercialRecoveryLeadMetrics
}

const metricTone = {
  blue: "border-info-border bg-info-soft text-info-strong",
  green: "border-success-border bg-success-soft text-success-strong",
  amber: "border-warning-border bg-warning-soft text-warning-strong",
  rose: "border-danger-border bg-danger-soft text-danger-strong",
  violet: "border-highlight-border bg-highlight-soft text-highlight-strong",
  slate: "border-border bg-muted/40 text-muted-foreground",
} as const

export function CommercialLeadMetrics({ metrics }: CommercialLeadMetricsProps) {
  const items = [
    {
      label: "Activos",
      value: metrics.totalActive,
      icon: Users,
      tone: "blue",
    },
    {
      label: "Novos",
      value: metrics.newCount,
      icon: Sparkles,
      tone: "violet",
    },
    {
      label: "Contactados",
      value: metrics.contactedCount,
      icon: Headphones,
      tone: "green",
    },
    {
      label: "Sem resposta",
      value: metrics.noAnswerCount,
      icon: PhoneMissed,
      tone: "amber",
    },
    {
      label: "Vencidos",
      value: metrics.overdueCount,
      icon: AlarmClock,
      tone: metrics.overdueCount > 0 ? "rose" : "slate",
    },
    {
      label: "Potencial",
      value: formatCurrency(
        minorToMajorCurrencyAmount(metrics.potentialAmount),
        metrics.currency
      ),
      icon: CircleDollarSign,
      tone: "green",
    },
  ] as const

  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-6">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <div
            key={item.label}
            className="rounded-lg border border-border/80 bg-card px-3 py-3 shadow-xs"
          >
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border",
                  metricTone[item.tone]
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  {item.label}
                </p>
                <p className="truncate text-sm font-bold tabular-nums text-foreground">
                  {item.value}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
