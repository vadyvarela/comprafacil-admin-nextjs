"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { formatCurrency } from "@/lib/utils/currency"

interface CountrySalesItem {
  name: string
  sales: number
}

interface CountrySalesChartProps {
  data: CountrySalesItem[]
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value?: number }>
  label?: string | number
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border/80 bg-popover px-3 py-2 shadow-none text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      <p className="tabular-nums text-muted-foreground">
        {formatCurrency(payload[0].value ?? 0)}
      </p>
    </div>
  )
}

export function CountrySalesChart({ data }: CountrySalesChartProps) {
  if (!data.length) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
        Sem dados por país
      </div>
    )
  }

  const chartData = [...data].reverse()

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 4, right: 8, bottom: 0, left: 4 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={(v) =>
            new Intl.NumberFormat("pt-PT", {
              notation: "compact",
              maximumFractionDigits: 1,
            }).format(v)
          }
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={72}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--accent)", opacity: 0.5 }} />
        <Bar dataKey="sales" fill="var(--primary)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
