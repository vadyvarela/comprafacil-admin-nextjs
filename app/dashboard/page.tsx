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

  const kpis = [
    {
      title: "Receita (30 dias)",
      value: formatCurrency(totalRevenue),
      description: "Últimos 30 dias",
      icon: TrendingUp,
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-600",
      accent: "border-l-emerald-500",
      href: "/dashboard/transactions",
    },
    {
      title: "Pedidos totais",
      value: totalOrders.toLocaleString("pt-PT"),
      description: "Pedidos pagos",
      icon: ShoppingCart,
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-600",
      accent: "border-l-blue-500",
      href: "/dashboard/orders",
    },
    {
      title: "Clientes",
      value: totalCustomers.toLocaleString("pt-PT"),
      description: "Clientes registados",
      icon: Users,
      iconBg: "bg-violet-500/10",
      iconColor: "text-violet-600",
      accent: "border-l-violet-500",
      href: "/dashboard/customers",
    },
    {
      title: "Ticket médio",
      value: formatCurrency(avgTicket),
      description: "Valor médio por pedido",
      icon: CreditCard,
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-600",
      accent: "border-l-amber-500",
      href: "/dashboard/analytics",
    },
  ]

  return (
    <>
      <DashboardHeader items={[{ label: "Dashboard" }]} />
      <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
        {/* Page title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">Visão geral</h1>
            <p className="text-xs text-muted-foreground mt-0.5 capitalize">
              {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
          <Link
            href="/dashboard/analytics"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/15 transition-colors"
          >
            <Sparkles className="h-3 w-3" />
            Analytics
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        {/* KPI cards */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <Link key={kpi.href} href={kpi.href} className="block group">
              <div className={`relative rounded-2xl border border-border bg-card p-5 border-l-4 ${kpi.accent} hover:shadow-md hover:border-border/80 transition-all duration-200`}>
                <div className="flex items-start justify-between mb-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${kpi.iconBg}`}>
                    <kpi.icon className={`h-5 w-5 ${kpi.iconColor}`} />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                </div>
                <p className="text-2xl font-bold tabular-nums text-foreground tracking-tight leading-none mb-1.5">
                  {kpi.value}
                </p>
                <p className="text-sm font-semibold text-foreground/80">{kpi.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{kpi.description}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent orders */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <ShoppingCart className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-sm font-semibold text-foreground">Pedidos recentes</span>
            </div>
            <Link
              href="/dashboard/orders"
              className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              Ver todos
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted mb-3">
                <ShoppingCart className="h-6 w-6 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Nenhum pedido ainda</p>
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
                    className="flex items-center gap-4 px-5 py-3 hover:bg-muted/40 transition-colors group"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/8 ring-1 ring-primary/15">
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
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground shrink-0 transition-colors" />
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              href: "/dashboard/products/new",
              icon: Package,
              label: "Novo produto",
              sub: "Adicionar ao catálogo",
              iconBg: "bg-indigo-500/10",
              iconColor: "text-indigo-600",
            },
            {
              href: "/dashboard/coupons/new",
              icon: Sparkles,
              label: "Criar cupão",
              sub: "Promoção ou desconto",
              iconBg: "bg-emerald-500/10",
              iconColor: "text-emerald-600",
            },
            {
              href: "/dashboard/orders",
              icon: Clock,
              label: "Pedidos pendentes",
              sub: "Ver a processar",
              iconBg: "bg-amber-500/10",
              iconColor: "text-amber-600",
            },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/25 hover:shadow-sm hover:bg-muted/30 transition-all group"
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${action.iconBg}`}>
                <action.icon className={`h-4.5 w-4.5 ${action.iconColor}`} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{action.label}</p>
                <p className="text-xs text-muted-foreground">{action.sub}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground/30 ml-auto group-hover:text-muted-foreground transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
