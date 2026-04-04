"use client"

import Link from "next/link"
import { ShoppingCart, ArrowRight, Calendar } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { OrderSummary } from "@/lib/graphql/orders/types"
import type { CheckoutSessionDetailsResponse } from "@/lib/graphql/orders/types"
import {
  getOrderStatusLabel,
  getOrderStatusClass,
  getFulfillmentStatusLabel,
  getFulfillmentStatusClass,
} from "@/lib/orders/status"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/utils/currency"

type EnrichedOrder = OrderSummary & {
  fulfillmentStatus?: CheckoutSessionDetailsResponse["fulfillmentStatus"] | null
}

type OrderListProps = {
  orders: EnrichedOrder[]
}

function formatOrderDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  try {
    return format(new Date(iso), "dd MMM · HH:mm", { locale: ptBR })
  } catch {
    return "—"
  }
}

function customerDisplay(customer: OrderSummary["customer"]): string {
  if (!customer) return "—"
  if (customer.name?.trim()) return customer.name.trim()
  if (customer.email?.trim()) return customer.email.trim()
  if (customer.identifier?.trim()) return customer.identifier.trim()
  return "—"
}

function customerEmail(customer: OrderSummary["customer"]): string | null {
  if (!customer) return null
  if (customer.name?.trim() && customer.email?.trim()) return customer.email.trim()
  return null
}

function productSummaryText(order: OrderSummary): string {
  if (order.productSummary?.trim()) return order.productSummary
  if (order.itemsCount && order.itemsCount > 0) return `${order.itemsCount} item(ns)`
  return "—"
}

function StatusBadge({ code, label }: { code: string | null | undefined; label: string }) {
  if (!code) return null
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getFulfillmentStatusClass(code)}`}>
      {label}
    </span>
  )
}

export function OrderList({ orders }: OrderListProps) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Desktop header */}
      <div className="hidden lg:grid lg:grid-cols-[1fr_1fr_160px_120px_44px] border-b border-border bg-muted/50 px-4 py-2.5">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Pedido</span>
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Cliente</span>
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Estado envio</span>
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide text-right">Valor</span>
        <span />
      </div>

      {/* Rows */}
      <div className="divide-y divide-border">
        {orders.map((order) => {
          const fulfillment = order.fulfillmentStatus
          const fulfillLabel = getFulfillmentStatusLabel(fulfillment?.code)

          return (
            <Link
              key={order.id}
              href={`/dashboard/orders/${order.id}`}
              className="group flex flex-col lg:grid lg:grid-cols-[1fr_1fr_160px_120px_44px] lg:items-center gap-3 lg:gap-0 px-4 py-3.5 hover:bg-muted/30 transition-colors"
            >
              {/* Order ref + date */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/8 ring-1 ring-primary/15 group-hover:bg-primary/12 transition-colors">
                  <ShoppingCart className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-foreground">
                      #{order.id.slice(0, 8)}
                    </span>
                    {/* Payment status badge (mobile only) */}
                    {order.status && (
                      <span className={`lg:hidden inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${getOrderStatusClass(order.status.code)}`}>
                        {getOrderStatusLabel(order.status.code)}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Calendar className="h-3 w-3 shrink-0" />
                    {formatOrderDate(order.createdAt)}
                  </p>
                  {/* Product summary mobile */}
                  <p className="lg:hidden text-xs text-muted-foreground truncate max-w-[220px] mt-0.5">
                    {productSummaryText(order)}
                  </p>
                </div>
              </div>

              {/* Customer + products (desktop combines both) */}
              <div className="hidden lg:flex flex-col min-w-0 pr-4">
                <p className="text-sm font-semibold text-foreground truncate">
                  {customerDisplay(order.customer)}
                </p>
                {customerEmail(order.customer) && (
                  <p className="text-xs text-muted-foreground truncate">
                    {customerEmail(order.customer)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {productSummaryText(order)}
                </p>
              </div>

              {/* Customer (mobile) */}
              <div className="lg:hidden flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {customerDisplay(order.customer)}
                  </p>
                </div>
              </div>

              {/* Fulfillment status */}
              <div className="flex items-center gap-2 flex-wrap">
                {fulfillment?.code ? (
                  <StatusBadge code={fulfillment.code} label={fulfillLabel} />
                ) : (
                  <span className="text-[11px] text-muted-foreground/50">—</span>
                )}
              </div>

              {/* Amount */}
              <div className="lg:text-right">
                <p className="text-sm font-bold tabular-nums text-foreground">
                  {formatCurrency(order.totalAmount ?? 0, order.currency)}
                </p>
                {order.status && (
                  <span className={`hidden lg:inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold mt-1 ${getOrderStatusClass(order.status.code)}`}>
                    {getOrderStatusLabel(order.status.code)}
                  </span>
                )}
              </div>

              {/* Arrow */}
              <div className="hidden lg:flex justify-center">
                <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
