import { DashboardHeader } from "@/components/layout/dashboard-header"
import { PageHeader } from "@/components/admin/page-header"
import { StatsCard } from "@/components/admin/stats-card"
import { getAnalyticsReport } from "@/lib/actions/analytics"
import { calcDelta } from "@/lib/analytics/period"
import { formatCurrency } from "@/lib/utils/currency"
import { RevenueAreaChart } from "@/components/analytics/revenue-area-chart"
import { PaymentStatusChart } from "@/components/analytics/payment-status-chart"
import { CountrySalesChart } from "@/components/analytics/country-sales-chart"
import { TopProductsCard } from "@/components/analytics/top-products-card"
import { TopCustomersCard } from "@/components/analytics/top-customers-card"
import { RecentPaymentsCard } from "@/components/analytics/recent-payments-card"
import { AnalyticsDateFilter } from "@/components/analytics/analytics-date-filter"
import { parseISO } from "date-fns"
import Link from "next/link"
import {
  TrendingUp,
  ShoppingCart,
  Users,
  CreditCard,
  BarChart3,
  Globe,
} from "lucide-react"

type PageProps = {
  searchParams: Promise<{ from?: string; to?: string }>
}

function parseDate(s: string | undefined): Date | null {
  if (!s) return null
  try {
    return parseISO(s)
  } catch {
    return null
  }
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const from = parseDate(params.from)
  const to = parseDate(params.to)

  const result = await getAnalyticsReport({ from, to })

  if (!result.ok) {
    return (
      <>
        <DashboardHeader
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Analytics" },
          ]}
        />
        <div className="flex flex-1 flex-col gap-5 p-4 md:p-5 bg-background">
          <p className="text-sm text-destructive">{result.error}</p>
        </div>
      </>
    )
  }

  const data = result.data
  const revenueDelta = calcDelta(data.kpis.revenue.current, data.kpis.revenue.previous)
  const ordersDelta = calcDelta(data.kpis.orders.current, data.kpis.orders.previous)
  const customersDelta = calcDelta(data.kpis.customers.current, data.kpis.customers.previous)
  const aovDelta = calcDelta(data.kpis.aov.current, data.kpis.aov.previous)

  const chartSubtitle =
    data.chartGranularity === "monthly"
      ? "Evolução mensal da receita"
      : "Evolução diária da receita"

  return (
    <>
      <DashboardHeader
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Analytics" },
        ]}
      />
      <div className="flex flex-1 flex-col gap-5 p-4 md:p-5 bg-background">
        <div className="animate-enter">
          <PageHeader title="Analytics" description="Métricas e desempenho de vendas">
            <AnalyticsDateFilter from={params.from} to={params.to} />
          </PageHeader>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Link href="/dashboard/transactions" className="block animate-enter">
            <StatsCard
              label="Receita"
              value={formatCurrency(data.kpis.revenue.current)}
              icon={TrendingUp}
              accentColor="emerald"
              delta={revenueDelta.delta}
              trend={revenueDelta.trend}
              period="vs período anterior"
            />
          </Link>
          <Link href="/dashboard/orders" className="block animate-enter-delay-1">
            <StatsCard
              label="Pedidos"
              value={data.kpis.orders.current.toLocaleString("pt-PT")}
              icon={ShoppingCart}
              accentColor="blue"
              delta={ordersDelta.delta}
              trend={ordersDelta.trend}
              period="vs período anterior"
            />
          </Link>
          <Link href="/dashboard/customers" className="block animate-enter-delay-2">
            <StatsCard
              label="Clientes"
              value={data.kpis.customers.current.toLocaleString("pt-PT")}
              icon={Users}
              accentColor="violet"
              delta={customersDelta.delta}
              trend={customersDelta.trend}
              period="compradores no período"
            />
          </Link>
          <Link href="/dashboard/transactions" className="block animate-enter-delay-3">
            <StatsCard
              label="Ticket médio"
              value={formatCurrency(data.kpis.aov.current)}
              icon={CreditCard}
              accentColor="amber"
              delta={aovDelta.delta}
              trend={aovDelta.trend}
              period="vs período anterior"
            />
          </Link>
        </div>

        <div className="rounded-lg border border-border/80 bg-card shadow-none overflow-hidden animate-enter">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <span className="text-sm font-semibold text-foreground">
                Receita — {data.period.label}
              </span>
              <p className="text-[11px] text-muted-foreground">{chartSubtitle}</p>
            </div>
          </div>
          <div className="px-5 pb-5 pt-4">
            <RevenueAreaChart
              data={data.chartData}
              granularity={data.chartGranularity}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <TopProductsCard products={data.topProducts} />
          <TopCustomersCard customers={data.topCustomers} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-border/80 bg-card shadow-none overflow-hidden animate-enter">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <CreditCard className="h-4 w-4 text-primary" />
              </div>
              <div>
                <span className="text-sm font-semibold text-foreground">
                  Estado dos pagamentos
                </span>
                <p className="text-[11px] text-muted-foreground">Todos os tempos</p>
              </div>
            </div>
            <div className="px-5 pb-4 pt-2">
              <PaymentStatusChart data={data.paymentStatus} />
            </div>
          </div>

          <div className="rounded-lg border border-border/80 bg-card shadow-none overflow-hidden animate-enter">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Globe className="h-4 w-4 text-primary" />
              </div>
              <div>
                <span className="text-sm font-semibold text-foreground">Vendas por país</span>
                <p className="text-[11px] text-muted-foreground">{data.period.label}</p>
              </div>
            </div>
            <div className="px-5 pb-4 pt-2">
              <CountrySalesChart data={data.countries} />
            </div>
          </div>
        </div>

        <RecentPaymentsCard payments={data.recentPayments} />
      </div>
    </>
  )
}
