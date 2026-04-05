import { DashboardHeader } from "@/components/layout/dashboard-header"
import { getTransactions } from "@/lib/actions/transactions"
import { getOrdersPage } from "@/lib/actions/orders"
import { getCustomers } from "@/lib/actions/customers"
import { formatCurrency } from "@/lib/utils/currency"
import { RevenueChart } from "@/components/analytics/revenue-chart"
import { AnalyticsDateFilter } from "@/components/analytics/analytics-date-filter"
import { format, subDays, startOfDay, parseISO, isWithinInterval, startOfDay as sod, endOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"
import {
  TrendingUp,
  ShoppingCart,
  Users,
  CreditCard,
  BarChart3,
  Package,
  ArrowRight,
} from "lucide-react"
import type { PaymentIntent } from "@/lib/graphql/transactions/types"

type PageProps = {
  searchParams: Promise<{ from?: string; to?: string }>
}

function parseDate(s: string | undefined): Date | null {
  if (!s) return null
  try { return parseISO(s) } catch { return null }
}

async function getAnalyticsData(from: Date | null, to: Date | null) {
  const [transactionsRes, ordersRes, customersRes] = await Promise.all([
    getTransactions({ page: { page: 0, size: 500 }, filter: {} }),
    getOrdersPage({ page: 0 }),
    getCustomers({ page: 0 }),
  ])

  let transactions: PaymentIntent[] = transactionsRes.ok ? transactionsRes.data.data : []
  const totalOrders = ordersRes.ok ? (ordersRes.data.totalElements ?? 0) : 0
  const totalCustomers = customersRes.ok ? customersRes.data.totalElements ?? 0 : 0
  const totalTransactions = transactionsRes.ok ? transactionsRes.data.totalElements ?? 0 : 0

  // Apply date filter
  const hasFilter = from || to
  if (hasFilter) {
    transactions = transactions.filter((tx) => {
      if (!tx.createdAt) return false
      const d = new Date(tx.createdAt)
      if (from && d < sod(from)) return false
      if (to && d > endOfDay(to)) return false
      return true
    })
  }

  // Chart: last 30 days or within filter range
  const chartDays = hasFilter && from && to
    ? Math.min(Math.ceil((to.getTime() - from.getTime()) / 86400000) + 1, 60)
    : 30
  const chartEnd = to ? startOfDay(to) : startOfDay(new Date())
  const days = Array.from({ length: chartDays }, (_, i) => {
    const date = subDays(chartEnd, chartDays - 1 - i)
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
    const dayEntry = days.find((d) => d.date.getTime() === txDate.getTime())
    if (dayEntry) {
      dayEntry.revenue += tx.amount
      dayEntry.orders++
    }
  }

  const totalRevenue = transactions.reduce((sum, tx) => sum + (tx.amount ?? 0), 0)
  const avgTicket = transactions.length > 0 ? Math.round(totalRevenue / transactions.length) : 0

  // Top products
  const productMap: Record<string, { name: string; revenue: number; qty: number }> = {}
  for (const tx of transactions) {
    const lines = tx.checkoutSession?.lines ?? []
    for (const line of lines) {
      const title = line.productVariant?.product?.title ?? "Produto desconhecido"
      const key = title
      if (!productMap[key]) productMap[key] = { name: title, revenue: 0, qty: 0 }
      productMap[key].revenue += (tx.amount ?? 0)
      productMap[key].qty += line.quantity ?? 1
    }
  }
  const topProducts = Object.values(productMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  // Status breakdown
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
    topProducts,
    statusMap,
    transactions,
    filteredCount: transactions.length,
    hasFilter,
  }
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const from = parseDate(params.from)
  const to = parseDate(params.to)

  const data = await getAnalyticsData(from, to)

  const kpis = [
    {
      title: "Receita",
      value: formatCurrency(data.totalRevenue),
      sub: data.hasFilter ? `${data.filteredCount} transações no período` : `de ${data.totalTransactions} transações totais`,
      icon: TrendingUp,
      gradient: "from-emerald-500 to-teal-600",
      glow: "shadow-emerald-500/25",
      href: "/dashboard/transactions",
    },
    {
      title: "Pedidos totais",
      value: data.totalOrders.toLocaleString("pt-PT"),
      sub: "Pedidos pagos",
      icon: ShoppingCart,
      gradient: "from-indigo-500 to-blue-600",
      glow: "shadow-indigo-500/25",
      href: "/dashboard/orders",
    },
    {
      title: "Clientes",
      value: data.totalCustomers.toLocaleString("pt-PT"),
      sub: "Registados",
      icon: Users,
      gradient: "from-violet-500 to-purple-600",
      glow: "shadow-violet-500/25",
      href: "/dashboard/customers",
    },
    {
      title: "Ticket médio",
      value: formatCurrency(data.avgTicket),
      sub: data.hasFilter ? "No período filtrado" : "Por transação",
      icon: CreditCard,
      gradient: "from-amber-500 to-orange-500",
      glow: "shadow-amber-500/25",
      href: "/dashboard/transactions",
    },
  ]

  const statusLabels: Record<string, string> = {
    COMPLETED: "Concluídas",
    PENDING: "Pendentes",
    FAILED: "Falhadas",
    CANCELLED: "Canceladas",
    AUTHORIZED: "Autorizadas",
    PS: "Pagamento com sucesso",
  }

  const statusColors: Record<string, string> = {
    COMPLETED: "bg-emerald-500",
    PS: "bg-emerald-500",
    PENDING: "bg-amber-500",
    FAILED: "bg-red-500",
    CANCELLED: "bg-slate-400",
    AUTHORIZED: "bg-blue-500",
  }

  const chartLabel = data.hasFilter && from && to
    ? `${format(from, "dd MMM", { locale: ptBR })} – ${format(to, "dd MMM yyyy", { locale: ptBR })}`
    : "últimos 30 dias"

  return (
    <>
      <DashboardHeader
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Analytics" },
        ]}
      />
      <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">

        {/* Header + filtro */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">Analytics</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Métricas e desempenho da loja
            </p>
          </div>
          <AnalyticsDateFilter from={params.from} to={params.to} />
        </div>

        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <Link key={kpi.href} href={kpi.href} className="block group">
              <div className={`relative rounded-2xl bg-gradient-to-br ${kpi.gradient} p-5 overflow-hidden shadow-lg ${kpi.glow} hover:scale-[1.02] transition-transform duration-200`}>
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
            </Link>
          ))}
        </div>

        {/* Revenue chart */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <BarChart3 className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-sm font-semibold text-foreground">
              Receita — {chartLabel}
            </span>
          </div>
          <div className="px-5 pb-5 pt-4">
            <RevenueChart data={data.chartData} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">

          {/* Top produtos */}
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <Package className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-sm font-semibold text-foreground">Produtos mais vendidos</span>
            </div>
            <div className="px-5 py-3">
              {data.topProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">Sem dados</p>
              ) : (
                <div className="divide-y divide-border">
                  {data.topProducts.map((p, i) => (
                    <div key={p.name} className="flex items-center gap-3 py-2.5">
                      <span className="text-[11px] font-bold tabular-nums text-muted-foreground w-4 shrink-0">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{p.name}</p>
                        <p className="text-[11px] text-muted-foreground">{p.qty} un.</p>
                      </div>
                      <span className="text-xs font-bold tabular-nums text-foreground shrink-0">
                        {formatCurrency(p.revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

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
                    const pct = Math.round((count / data.filteredCount) * 100)
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
        </div>

        {/* Recent transactions */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <span className="text-sm font-semibold text-foreground">Transações recentes</span>
            <Link href="/dashboard/transactions" className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
              Ver todas <ArrowRight className="h-3 w-3" />
            </Link>
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
                        {tx.createdAt && (
                          <span className="ml-2">
                            {format(new Date(tx.createdAt), "dd MMM, HH:mm", { locale: ptBR })}
                          </span>
                        )}
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
    </>
  )
}
