import { Suspense } from "react"
import Link from "next/link"
import { endOfMonth, endOfYear, format, startOfMonth, startOfYear, subMonths } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CreditCard, Percent, ShoppingCart, Wallet } from "lucide-react"
import { getPlatformRevenue, getPlatformTransactions } from "@/lib/actions/platform"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { StatsCard } from "@/components/admin/stats-card"
import { DataPanel, DataPanelHeader } from "@/components/admin/data-panel"
import { EmptyState } from "@/components/admin/empty-state"
import { LoadError } from "@/components/admin/load-error"
import { AuditLogPagination } from "@/components/logs/audit-log-pagination"
import { PlatformTransactionList } from "@/components/platform/platform-transaction-list"
import { formatCurrency, minorToMajorCurrencyAmount } from "@/lib/utils/currency"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

const PAGE_SIZE = 25

const PERIODS = [
  { value: "month", label: "Este mês" },
  { value: "last-month", label: "Mês passado" },
  { value: "year", label: "Este ano" },
  { value: "all", label: "Tudo" },
] as const

type Period = (typeof PERIODS)[number]["value"]

const STATUSES = [
  { value: "PS", label: "Pagas" },
  { value: "PF", label: "Falhadas" },
  { value: "PC", label: "Canceladas" },
] as const

function periodRange(period: Period): { dateFrom: string | null; dateTo: string | null } {
  const now = new Date()
  const iso = (d: Date) => format(d, "yyyy-MM-dd'T'HH:mm:ss")
  switch (period) {
    case "month":
      return { dateFrom: iso(startOfMonth(now)), dateTo: iso(endOfMonth(now)) }
    case "last-month": {
      const last = subMonths(now, 1)
      return { dateFrom: iso(startOfMonth(last)), dateTo: iso(endOfMonth(last)) }
    }
    case "year":
      return { dateFrom: iso(startOfYear(now)), dateTo: iso(endOfYear(now)) }
    case "all":
      return { dateFrom: null, dateTo: null }
  }
}

function monthLabel(month: string): string {
  try {
    return format(new Date(`${month}-01T12:00:00`), "MMMM yyyy", { locale: ptBR })
  } catch {
    return month
  }
}

type PageProps = {
  searchParams: Promise<{ period?: string; status?: string; page?: string }>
}

export default async function PlatformRevenuePage({ searchParams }: PageProps) {
  const params = await searchParams
  const period: Period = PERIODS.some((p) => p.value === params.period)
    ? (params.period as Period)
    : "month"
  const status = STATUSES.some((s) => s.value === params.status) ? params.status! : "PS"
  const page = Math.max(0, Math.floor(Number(params.page) || 0))
  const range = periodRange(period)

  const [summary, history, transactions] = await Promise.all([
    getPlatformRevenue(range),
    getPlatformRevenue({}),
    getPlatformTransactions({
      filter: { ...range, status },
      page: { page, size: PAGE_SIZE },
    }),
  ])

  const href = (next: Record<string, string>) => {
    const q = new URLSearchParams({ period, status, ...next })
    if (!("page" in next)) q.delete("page")
    return `/dashboard/platform?${q.toString()}`
  }

  const currency = summary.ok ? summary.data.currency : "CVE"
  const money = (minor: number) => formatCurrency(minorToMajorCurrencyAmount(minor), currency)
  const periodLabel = PERIODS.find((p) => p.value === period)?.label ?? ""

  return (
    <>
      <DashboardHeader
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Plataforma" },
          { label: "Comissão" },
        ]}
      />
      <div className="flex-1 space-y-5 overflow-auto p-5">
        <nav aria-label="Período" className="flex flex-wrap gap-1.5">
          {PERIODS.map((p) => (
            <Link
              key={p.value}
              href={href({ period: p.value })}
              className={cn(
                "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                p.value === period
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {p.label}
            </Link>
          ))}
        </nav>

        {summary.ok ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatsCard
              label="A tua comissão"
              value={money(summary.data.commissionAmount)}
              icon={Wallet}
              accentColor="emerald"
              period={periodLabel}
            />
            <StatsCard
              label="Vendas pagas"
              value={money(summary.data.grossAmount)}
              icon={CreditCard}
              accentColor="blue"
              period="Total pago pelos clientes, com envio"
            />
            <StatsCard
              label="Pedidos pagos"
              value={summary.data.orderCount.toLocaleString("pt-PT")}
              icon={ShoppingCart}
              accentColor="violet"
              period={periodLabel}
            />
            <StatsCard
              label="Taxa"
              value={`${(summary.data.commissionRate * 100).toLocaleString("pt-PT", { maximumFractionDigits: 2 })}%`}
              icon={Percent}
              accentColor="amber"
              period="Sobre cada venda paga no site"
            />
          </div>
        ) : (
          <LoadError message={summary.error} />
        )}

        {history.ok && history.data.months.length > 0 ? (
          <DataPanel>
            <DataPanelHeader>
              <span className="text-xs font-bold uppercase">Por mês</span>
              <span className="text-xs text-muted-foreground">
                Total desde o início: <strong className="text-foreground">{money(history.data.commissionAmount)}</strong>
              </span>
            </DataPanelHeader>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Mês</th>
                  <th className="px-4 py-2 text-right font-medium">Pedidos</th>
                  <th className="px-4 py-2 text-right font-medium">Vendas</th>
                  <th className="px-4 py-2 text-right font-medium">Comissão</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {history.data.months.map((m) => (
                  <tr key={m.month} className="border-t border-border/60">
                    <td className="px-4 py-2 capitalize">{monthLabel(m.month)}</td>
                    <td className="px-4 py-2 text-right">{m.orderCount}</td>
                    <td className="px-4 py-2 text-right">{money(m.grossAmount)}</td>
                    <td className="px-4 py-2 text-right font-semibold">{money(m.commissionAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataPanel>
        ) : null}

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Transacções · {periodLabel}</h2>
            <nav aria-label="Estado" className="flex gap-1.5">
              {STATUSES.map((s) => (
                <Link
                  key={s.value}
                  href={href({ status: s.value })}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-xs font-medium",
                    s.value === status
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {s.label}
                </Link>
              ))}
            </nav>
          </div>

          {!transactions.ok ? (
            <LoadError message={transactions.error} />
          ) : transactions.data.data.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="Sem transacções"
              description="Nada neste período com este estado."
              tone="neutral"
            />
          ) : (
            <>
              <PlatformTransactionList transactions={transactions.data.data} />
              <Suspense fallback={null}>
                <AuditLogPagination
                  currentPage={page}
                  totalPages={transactions.data.totalPages}
                  totalElements={transactions.data.totalElements}
                  pageSize={PAGE_SIZE}
                />
              </Suspense>
            </>
          )}
        </section>
      </div>
    </>
  )
}
