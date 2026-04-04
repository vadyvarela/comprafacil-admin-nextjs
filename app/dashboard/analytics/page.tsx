import { DashboardHeader } from "@/components/layout/dashboard-header"
import { getTransactions } from "@/lib/actions/transactions"
import { getOrdersPage } from "@/lib/actions/orders"
import { getCustomers } from "@/lib/actions/customers"
import { formatCurrency } from "@/lib/utils/currency"
import { RevenueChart } from "@/components/analytics/revenue-chart"
import { format, subDays, startOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  TrendingUp,
  ShoppingCart,
  Users,
  CreditCard,
  BarChart3,
} from "lucide-react"
import type { PaymentIntent } from "@/lib/graphql/transactions/types"

async function getAnalyticsData() {
  const [transactionsRes, ordersRes, customersRes] = await Promise.all([
    getTransactions({ page: { page: 0, size: 100 }, filter: {} }),
    getOrdersPage({ page: 0 }),
    getCustomers({ page: 0 }),
  ])

  const transactions: PaymentIntent[] = transactionsRes.ok ? transactionsRes.data.data : []
  const totalOrders = ordersRes.ok ? (ordersRes.data.totalElements ?? 0) : 0
  const totalCustomers = customersRes.ok ? customersRes.data.totalElements ?? 0 : 0
  const totalTransactions = transactionsRes.ok ? transactionsRes.data.totalElements ?? 0 : 0

  // Revenue by day (last 14 days)
  const today = startOfDay(new Date())
  const days = Array.from({ length: 14 }, (_, i) => {
    const date = subDays(today, 13 - i)
    return {
      date,
      label: format(date, "dd/MM", { locale: ptBR }),
      revenue: 0,
      orders: 0,
    }
  })

  for (const tx of transactions) {
    if (!tx.createdAt || !tx.amount) continue
    const txDate = startOfDay(new Date(tx.createdAt))
    const dayEntry = days.find(
      (d) => d.date.getTime() === txDate.getTime()
    )
    if (dayEntry) {
      dayEntry.revenue += tx.amount
      dayEntry.orders++
    }
  }

  // Total revenue from fetched transactions
  const totalRevenue = transactions.reduce((sum, tx) => sum + (tx.amount ?? 0), 0)
  const avgTicket = transactions.length > 0 ? Math.round(totalRevenue / transactions.length) : 0

  // Top payment providers
  const providerMap: Record<string, number> = {}
  for (const tx of transactions) {
    const method = tx.status?.description || "Outro"
    providerMap[method] = (providerMap[method] ?? 0) + tx.amount
  }
  const topProviders = Object.entries(providerMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  // Payment status breakdown
  const statusMap: Record<string, number> = {}
  for (const tx of transactions) {
    const s = tx.status?.code ?? "UNKNOWN"
    statusMap[s] = (statusMap[s] ?? 0) + 1
  }

  return {
    totalRevenue,
    totalOrders,
    totalCustomers,
    totalTransactions,
    avgTicket,
    chartData: days,
    topProviders,
    statusMap,
    transactions,
  }
}

export default async function AnalyticsPage() {
  const data = await getAnalyticsData()

  const kpis = [
    {
      title: "Receita total",
      value: formatCurrency(data.totalRevenue),
      sub: `${data.transactions.length} transações carregadas`,
      icon: TrendingUp,
      gradient: "from-emerald-500 to-teal-600",
      glow: "shadow-emerald-500/25",
    },
    {
      title: "Total pedidos",
      value: data.totalOrders.toLocaleString("pt-PT"),
      sub: "Pedidos pagos",
      icon: ShoppingCart,
      gradient: "from-indigo-500 to-blue-600",
      glow: "shadow-indigo-500/25",
    },
    {
      title: "Clientes",
      value: data.totalCustomers.toLocaleString("pt-PT"),
      sub: "Registados",
      icon: Users,
      gradient: "from-violet-500 to-purple-600",
      glow: "shadow-violet-500/25",
    },
    {
      title: "Ticket médio",
      value: formatCurrency(data.avgTicket),
      sub: "Por transação",
      icon: CreditCard,
      gradient: "from-amber-500 to-orange-500",
      glow: "shadow-amber-500/25",
    },
  ]

  const statusLabels: Record<string, string> = {
    COMPLETED: "Concluídas",
    PENDING: "Pendentes",
    FAILED: "Falhadas",
    CANCELLED: "Canceladas",
    AUTHORIZED: "Autorizadas",
  }

  const statusColors: Record<string, string> = {
    COMPLETED: "bg-emerald-500",
    PENDING: "bg-amber-500",
    FAILED: "bg-red-500",
    CANCELLED: "bg-slate-400",
    AUTHORIZED: "bg-blue-500",
  }

  return (
    <>
      <DashboardHeader
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Analytics" },
        ]}
      />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        {/* Title */}
        <div>
          <h1 className="text-xl font-bold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Métricas e desempenho da loja
          </p>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <div key={kpi.title} className={`relative rounded-2xl bg-gradient-to-br ${kpi.gradient} p-5 overflow-hidden shadow-lg ${kpi.glow}`}>
              <div className="absolute inset-0 bg-white/5 rounded-2xl" />
              <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
              <div className="absolute -right-1 -bottom-6 h-24 w-24 rounded-full bg-black/10" />
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 mb-4">
                  <kpi.icon className="h-5 w-5 text-white" />
                </div>
                <p className="text-3xl font-bold tabular-nums text-white tracking-tight leading-none mb-1.5">
                  {kpi.value}
                </p>
                <p className="text-sm font-semibold text-white/90">{kpi.title}</p>
                <p className="text-xs text-white/60 mt-0.5">{kpi.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Revenue chart */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <BarChart3 className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-sm font-semibold text-foreground">Receita — últimos 14 dias</span>
          </div>
          <div className="px-5 pb-5 pt-4">
            <RevenueChart data={data.chartData} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Status breakdown */}
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <span className="text-sm font-semibold text-foreground">Estado das transações</span>
            </div>
            <div className="px-5 py-4">
              {Object.keys(data.statusMap).length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem dados</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(data.statusMap).map(([code, count]) => {
                    const pct = Math.round((count / data.transactions.length) * 100)
                    return (
                      <div key={code}>
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="text-foreground font-semibold">
                            {statusLabels[code] ?? code}
                          </span>
                          <span className="tabular-nums font-medium text-muted-foreground">
                            {count} · {pct}%
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${statusColors[code] ?? "bg-primary"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Recent transactions table */}
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <span className="text-sm font-semibold text-foreground">Últimas transações</span>
            </div>
            <div className="px-5 py-2">
              {data.transactions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">Sem transações</p>
              ) : (
                <div className="divide-y divide-border">
                  {data.transactions.slice(0, 8).map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {tx.customer?.name || tx.customer?.email || "—"}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {tx.status?.code ?? "—"}
                        </p>
                      </div>
                      <span className="text-xs font-bold tabular-nums text-foreground shrink-0">
                        {formatCurrency(tx.amount ?? 0, tx.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
