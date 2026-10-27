import { DashboardHeader } from "@/components/layout/dashboard-header"
import { PageHeader } from "@/components/admin/page-header"
import { StatsCard } from "@/components/admin/stats-card"
import { DataPanel, DataPanelHeader } from "@/components/admin/data-panel"
import { AnalyticsDateFilter } from "@/components/analytics/analytics-date-filter"
import {
  FunnelChart,
  FunnelPayments,
  FunnelSources,
  formatPct,
  pct,
} from "@/components/analytics/funnel-chart"
import { fetchFunnel, type FunnelData } from "@/lib/actions/funnel"
import {
  calcDelta,
  periodLabel,
  previousPeriod,
  resolveAnalyticsPeriod,
} from "@/lib/analytics/period"
import { parseISO } from "date-fns"
import { CreditCard, Filter, Globe, Percent, ShoppingCart, Users, XCircle } from "lucide-react"

type PageProps = {
  searchParams: Promise<{ from?: string; to?: string }>
}

function parseDate(s: string | undefined): Date | null {
  if (!s) return null
  const date = parseISO(s)
  return Number.isNaN(date.getTime()) ? null : date
}

function summarize(data: FunnelData) {
  const sessions = (name: string) =>
    data.steps.find((s) => s.eventName === name)?.sessions ?? 0
  const visits = sessions("page_view")
  const carts = sessions("add_to_cart")
  const purchases = sessions("purchase")
  const failed = data.payments
    .filter((p) => p.status === "PF" || p.status === "PC")
    .reduce((sum, p) => sum + p.total, 0)
  const attempts = data.payments.reduce((sum, p) => sum + p.total, 0)
  return {
    visits,
    conversion: pct(purchases, visits),
    cartAbandon: carts ? 100 - pct(purchases, carts) : 0,
    failed,
    attempts,
  }
}

function pointsDelta(current: number, previous: number) {
  const diff = Math.round((current - previous) * 10) / 10
  return {
    delta: `${diff >= 0 ? "+" : ""}${diff.toLocaleString("pt-PT")} p.p.`,
    trend: diff > 0 ? ("up" as const) : diff < 0 ? ("down" as const) : ("neutral" as const),
  }
}

const BREADCRUMB = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Plataforma" },
  { label: "Funil de conversão" },
]

export default async function FunnelPage({ searchParams }: PageProps) {
  const params = await searchParams
  const period = resolveAnalyticsPeriod(parseDate(params.from), parseDate(params.to))
  const [result, previous] = await Promise.all([
    fetchFunnel(period),
    fetchFunnel(previousPeriod(period)),
  ])

  if (!result.ok) {
    return (
      <>
        <DashboardHeader items={BREADCRUMB} />
        <div className="flex flex-1 flex-col gap-5 bg-background p-4 md:p-5">
          <p className="text-sm text-destructive">{result.message}</p>
        </div>
      </>
    )
  }

  const data = result.data
  const now = summarize(data)
  const before = previous.ok ? summarize(previous.data) : null
  const label = periodLabel(period)

  return (
    <>
      <DashboardHeader items={BREADCRUMB} />
      <div className="flex flex-1 flex-col gap-5 bg-background p-4 md:p-5">
        <div className="animate-enter">
          <PageHeader
            title="Funil de conversão"
            description="Onde os visitantes desistem, do primeiro clique até ao pagamento"
          >
            <AnalyticsDateFilter from={params.from} to={params.to} />
          </PageHeader>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatsCard
            className="animate-enter"
            label="Visitas"
            value={now.visits.toLocaleString("pt-PT")}
            icon={Users}
            accentColor="blue"
            {...(before ? calcDelta(now.visits, before.visits) : {})}
            period={before ? "vs período anterior" : label}
          />
          <StatsCard
            className="animate-enter-delay-1"
            label="Taxa de conversão"
            value={formatPct(now.conversion)}
            icon={Percent}
            accentColor="emerald"
            {...(before ? pointsDelta(now.conversion, before.conversion) : {})}
            period="visitas que compraram"
          />
          <StatsCard
            className="animate-enter-delay-2"
            label="Abandono do carrinho"
            value={formatPct(now.cartAbandon)}
            icon={ShoppingCart}
            accentColor="amber"
            period="adicionaram e não compraram"
          />
          <StatsCard
            className="animate-enter-delay-3"
            label="Pagamentos falhados"
            value={now.failed.toLocaleString("pt-PT")}
            icon={XCircle}
            accentColor="rose"
            period={
              now.attempts
                ? `${formatPct(pct(now.failed, now.attempts))} das ${now.attempts} tentativas`
                : "sem tentativas"
            }
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <DataPanel className="animate-enter">
            <DataPanelHeader className="px-5 py-4">
              <PanelTitle icon={Filter} title="Funil" subtitle={`Sessões por passo · ${label}`} />
            </DataPanelHeader>
            <div className="px-2 pb-4 pt-3 sm:px-3">
              <FunnelChart steps={data.steps} />
            </div>
          </DataPanel>

          <DataPanel className="animate-enter">
            <DataPanelHeader className="px-5 py-4">
              <PanelTitle
                icon={CreditCard}
                title="Tentativas de pagamento"
                subtitle={`Como acabaram · ${label}`}
              />
            </DataPanelHeader>
            <div className="px-5 pb-5 pt-4">
              <FunnelPayments payments={data.payments} />
            </div>
          </DataPanel>
        </div>

        <DataPanel className="animate-enter">
          <DataPanelHeader className="px-5 py-4">
            <PanelTitle
              icon={Globe}
              title="Origem do tráfego"
              subtitle="Primeira origem conhecida de cada sessão (UTM ou site de onde veio)"
            />
          </DataPanelHeader>
          <FunnelSources sources={data.sources} />
        </DataPanel>
      </div>
    </>
  )
}

function PanelTitle({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof Filter
  title: string
  subtitle: string
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  )
}
