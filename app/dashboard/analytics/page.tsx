import { DashboardHeader } from "@/components/layout/dashboard-header"
import { PageHeader } from "@/components/admin/page-header"
import { StatsCard } from "@/components/admin/stats-card"
import { getTransactions } from "@/lib/actions/transactions"
import { getOrdersPage } from "@/lib/actions/orders"
import { getCustomers } from "@/lib/actions/customers"
import { formatCurrency } from "@/lib/utils/currency"
import { RevenueChart } from "@/components/analytics/revenue-chart"
import { AnalyticsDateFilter } from "@/components/analytics/analytics-date-filter"
import { format, subDays, startOfDay, parseISO, startOfDay as sod, endOfDay } from "date-fns"
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
      <div className="flex flex-1 flex-col gap-6 p-5 md:p-6 bg-grid">
        {/* Header + filter */}
        <div className="animate-enter">
          <PageHeader
            title="Analytics"
            description="Métricas e desempenho da loja"
          >
            <AnalyticsDateFilter from={params.from} to={params.to} />
          </PageHeader>
        </div>

        {/* KPIs — consistent StatsCard */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Link href="/dashboard/transactions" className="block animate-enter">
            <StatsCard
              label="Receita"
              value={formatCurrency(data.totalRevenue)}
              icon={TrendingUp}
              accentColor="emerald"
              period={data.hasFilter ? `${data.filteredCount} transações no período` : `de ${data.totalTransactions} transações totais`}
            />
          </Link>
          <Link href="/dashboard/orders" className="block animate-enter-delay-1">
            <StatsCard
              label="Pedidos totais"
              value={data.totalOrders.toLocaleString("pt-PT")}
              icon={ShoppingCart}
              accentColor="blue"
              period="Pedidos pagos"
            />
          </Link>
          <Link href="/dashboard/customers" className="block animate-enter-delay-2">
            <StatsCard
              label="Clientes"
              value={data.totalCustomers.toLocaleString("pt-PT")}
              icon={Users}
              accentColor="violet"
              period="Registados"
            />
          </Link>
          <Link href="/dashboard/transactions" className="block animate-enter-delay-3">
            <StatsCard
              label="Ticket médio"
              value={formatCurrency(data.avgTicket)}
              icon={CreditCard}
              accentColor="amber"
              period={data.hasFilter ? "No período filtrado" : "Por transação"}
            />
          </Link>
        </div>

        {/* Revenue chart */}
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden animate-enter">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <span className="text-sm font-semibold text-foreground">Receita — {chartLabel}</span>
              <p className="text-[11px] text-muted-foreground">Evolução diária da receita</p>
            </div>
          </div>
          <div className="px-5 pb-5 pt-4">
            <RevenueChart data={data.chartData} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Top products */}
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden animate-enter">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Package className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-semibold text-foreground">Produtos mais vendidos</span>
              </div>
              <Link href="/dashboard/products" className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                Ver todos <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="px-5 py-3">
              {data.topProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Package className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground">Sem dados de vendas</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {data.topProducts.map((p, i) => (
                    <div key={p.name} className="flex items-center gap-3 py-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-[11px] font-bold tabular-nums text-muted-foreground shrink-0">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                        <p className="text-[11px] text-muted-foreground">{p.qty} un.</p>
                      </div>
                      <span className="text-sm font-bold tabular-nums text-foreground shrink-0 font-mono">
                        {formatCurrency(p.revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Status breakdown */}
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden animate-enter">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <CreditCard className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-semibold text-foreground">Estado das transações</span>
            </div>
            <div className="px-5 py-4">
              {Object.keys(data.statusMap).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CreditCard className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground">Sem dados</p>
                </div>
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
                          <span className="tabular-nums font-medium text-muted-foreground font-mono">
                            {count} · {pct}%
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${statusColors[code] ?? "bg-primary"}`}
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
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden animate-enter">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <CreditCard className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-semibold text-foreground">Transações recentes</span>
            </div>
            <Link href="/dashboard/transactions" className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
              Ver todas <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="px-5 py-2">
            {data.transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CreditCard className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground">Sem transações</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {data.transactions.slice(0, 8).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
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
                    <span className="text-sm font-bold tabular-nums text-foreground shrink-0 font-mono">
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
