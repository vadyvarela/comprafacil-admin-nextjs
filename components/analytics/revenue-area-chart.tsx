"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { formatCurrency } from "@/lib/utils/currency"

interface RevenueDataPoint {
  label: string
  revenue: number
  orders: number
}

interface RevenueAreaChartProps {
  data: RevenueDataPoint[]
  granularity?: "daily" | "monthly"
}

type ChartTooltipPayload = {
  name?: string
  color?: string
  value?: number | string
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: ChartTooltipPayload[]
  label?: string | number
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border/80 bg-popover px-3 py-2 shadow-none text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }} className="tabular-nums">
          {entry.name === "revenue"
            ? `Receita: ${formatCurrency(Number(entry.value ?? 0))}`
            : `Pedidos: ${entry.value}`}
        </p>
      ))}
    </div>
  )
}

export function RevenueAreaChart({ data, granularity = "daily" }: RevenueAreaChartProps) {
  if (!data.length) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
        Sem dados suficientes para o gráfico
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          axisLine={false}
          tickLine={false}
          interval={granularity === "monthly" ? 0 : "preserveStartEnd"}
        />
        <YAxis
          tickFormatter={(v) =>
            new Intl.NumberFormat("pt-PT", {
              notation: "compact",
              maximumFractionDigits: 1,
            }).format(v)
          }
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: "var(--border)" }} />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="var(--primary)"
          fill="url(#revenueGradient)"
          strokeWidth={2}
          name="revenue"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
