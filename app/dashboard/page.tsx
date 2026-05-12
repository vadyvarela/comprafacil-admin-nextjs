import Link from "next/link"
import {
  ShoppingCart,
  CreditCard,
  Users,
  TrendingUp,
  ArrowRight,
  ArrowUpRight,
  Package,
  Clock,
  Sparkles,
} from "lucide-react"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { PageHeader } from "@/components/admin/page-header"
import { StatsCard } from "@/components/admin/stats-card"
import { getOrdersPageWithDetails } from "@/lib/actions/orders"
import { getCustomers } from "@/lib/actions/customers"
import { getDashboardStats } from "@/lib/actions/stats"
import { getFulfillmentStatusLabel, getFulfillmentStatusVariant } from "@/lib/orders/status"
import { formatCurrency } from "@/lib/utils/currency"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { OrderSummary } from "@/lib/graphql/orders/types"
import type { CheckoutSessionDetailsResponse } from "@/lib/graphql/orders/types"

async function getDashboardData() {
  const [statsRes, customersRes, recentOrdersRes] = await Promise.all([
    getDashboardStats({ days: 30 }),
    getCustomers({ page: 0 }),
    getOrdersPageWithDetails({ page: 0 }),
  ])

  const totalRevenue = statsRes.ok ? (statsRes.data.salesSummary?.totalRevenue ?? 0) : 0
  const totalOrders = statsRes.ok
    ? statsRes.data.paymentStatusSummary.reduce((sum, s) => sum + (s.quantity ?? 0), 0)
    : 0
  const totalCustomers = customersRes.ok ? customersRes.data.totalElements ?? 0 : 0
  const avgTicket = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0
  const recentOrders = recentOrdersRes.ok ? recentOrdersRes.data.data.slice(0, 6) : []

  return {
    totalOrders,
    totalRevenue,
    totalCustomers,
    avgTicket,
    recentOrders,
  }
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—"
  try {
    return format(new Date(iso), "dd MMM, HH:mm", { locale: ptBR })
  } catch {
    return "—"
  }
}

function customerName(customer: OrderSummary["customer"]) {
  if (!customer) return "—"
  return customer.name?.trim() || customer.email?.trim() || "—"
}

type FulfillmentCode = "PENDING" | "PREPARING" | "SHIPPED" | "DELIVERED" | "CANCELLED"

function FulfillmentBadge({ code }: { code: string | null | undefined }) {
  if (!code) return <span className="text-muted-foreground text-xs">—</span>
  const variant = getFulfillmentStatusVariant(code)
  const label = getFulfillmentStatusLabel(code)

  const colorMap: Record<string, string> = {
    default: "badge-success",
    secondary: "badge-info",
    destructive: "badge-danger",
    outline: "badge-warning",
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${colorMap[variant] ?? "badge-neutral"}`}
    >
      {label}
    </span>
  )
}

export default async function DashboardPage() {
  const { totalOrders, totalRevenue, totalCustomers, avgTicket, recentOrders } =
    await getDashboardData()

  return (
    <>
      <DashboardHeader items={[{ label: "Dashboard" }]} />
      <div className="flex flex-1 flex-col gap-5 p-4 md:p-5 bg-background">
        {/* Page header */}
        <div className="animate-enter">
          <PageHeader
            title="Visão geral"
            description={format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          >
            <Link
              href="/dashboard/analytics"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Analytics
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </PageHeader>
        </div>

        {/* KPI cards */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Link href="/dashboard/transactions" className="block animate-enter">
            <StatsCard
              label="Receita (30 dias)"
              value={formatCurrency(totalRevenue)}
              icon={TrendingUp}
              accentColor="emerald"
              period="Últimos 30 dias"
            />
          </Link>
          <Link href="/dashboard/orders" className="block animate-enter-delay-1">
            <StatsCard
              label="Pedidos totais"
              value={totalOrders.toLocaleString("pt-PT")}
              icon={ShoppingCart}
              accentColor="blue"
              period="Pedidos pagos"
            />
          </Link>
          <Link href="/dashboard/customers" className="block animate-enter-delay-2">
            <StatsCard
              label="Clientes"
              value={totalCustomers.toLocaleString("pt-PT")}
              icon={Users}
              accentColor="violet"
              period="Clientes registados"
            />
          </Link>
          <Link href="/dashboard/analytics" className="block animate-enter-delay-3">
            <StatsCard
              label="Ticket médio"
              value={formatCurrency(avgTicket)}
              icon={CreditCard}
              accentColor="amber"
              period="Valor médio por pedido"
            />
          </Link>
        </div>

        {/* Recent orders */}
        <div className="rounded-lg border border-border/80 bg-card shadow-none overflow-hidden animate-enter">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/80 bg-muted/25">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md border border-border/60 bg-card">
                <ShoppingCart className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <span className="text-sm font-medium text-foreground">Pedidos recentes</span>
                <p className="text-[11px] text-muted-foreground">Últimas transações processadas</p>
              </div>
            </div>
            <Link
              href="/dashboard/orders"
              className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Ver todos
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-muted/50 mb-2.5">
                <ShoppingCart className="h-6 w-6 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Nenhum pedido ainda</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Os pedidos aparecerão aqui após a primeira venda</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentOrders.map((order) => {
                const fulfillment = (order as OrderSummary & {
                  fulfillmentStatus?: CheckoutSessionDetailsResponse["fulfillmentStatus"] | null
                }).fulfillmentStatus

                return (
                  <Link
                    key={order.id}
                    href={`/dashboard/orders/${order.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/35 transition-colors group"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted/40">
                      <ShoppingCart className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-xs font-bold text-foreground">
                          #{order.id.slice(0, 8)}
                        </span>
                        <FulfillmentBadge code={fulfillment?.code} />
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {customerName(order.customer)}
                        {order.productSummary && (
                          <span className="text-muted-foreground/60"> · {order.productSummary}</span>
                        )}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold tabular-nums text-foreground">
                        {formatCurrency(order.totalAmount ?? 0, order.currency)}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-muted-foreground shrink-0 transition-colors" />
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="grid gap-2 sm:grid-cols-3 animate-enter">
          {[
            {
              href: "/dashboard/products/new",
              icon: Package,
              label: "Novo produto",
              sub: "Adicionar ao catálogo",
              iconBg: "bg-indigo-50",
              iconColor: "text-indigo-700",
            },
            {
              href: "/dashboard/coupons",
              icon: Sparkles,
              label: "Criar cupão",
              sub: "Promoção ou desconto",
              iconBg: "bg-emerald-50",
              iconColor: "text-emerald-700",
            },
            {
              href: "/dashboard/orders",
              icon: Clock,
              label: "Pedidos pendentes",
              sub: "Ver a processar",
              iconBg: "bg-amber-50",
              iconColor: "text-amber-800",
            },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center gap-3 rounded-lg border border-border/80 bg-card p-3.5 hover:border-border hover:bg-muted/25 transition-colors group"
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border/60 ${action.iconBg}`}
              >
                <action.icon className={`h-4 w-4 ${action.iconColor}`} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{action.label}</p>
                <p className="text-[11px] text-muted-foreground">{action.sub}</p>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 ml-auto group-hover:text-muted-foreground transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
