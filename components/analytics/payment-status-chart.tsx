"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

interface PaymentStatusItem {
  code: string
  label: string
  quantity: number
}

interface PaymentStatusChartProps {
  data: PaymentStatusItem[]
}

const COLORS = [
  "var(--chart-1, #10b981)",
  "var(--chart-2, #f59e0b)",
  "var(--chart-3, #ef4444)",
  "var(--chart-4, #94a3b8)",
  "var(--chart-5, #3b82f6)",
  "var(--primary)",
]

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ name?: string; value?: number; payload?: PaymentStatusItem }>
}) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="rounded-lg border border-border/80 bg-popover px-3 py-2 shadow-none text-xs">
      <p className="font-semibold text-foreground">{item.name}</p>
      <p className="tabular-nums text-muted-foreground">{item.value} transações</p>
    </div>
  )
}

export function PaymentStatusChart({ data }: PaymentStatusChartProps) {
  const chartData = data.filter((d) => d.quantity > 0)

  if (!chartData.length) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
        Sem dados
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="quantity"
          nameKey="label"
          cx="50%"
          cy="50%"
          innerRadius={52}
          outerRadius={78}
          paddingAngle={2}
        >
          {chartData.map((entry, index) => (
            <Cell key={entry.code} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11 }}
          formatter={(value) => (
            <span className="text-muted-foreground">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
