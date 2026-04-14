"use client"

import Link from "next/link"
import { ShoppingCart, ArrowRight, Calendar, ImageIcon } from "lucide-react"
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
import Image from "next/image"

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

function OrderProductPreview({ order }: { order: OrderSummary }) {
  const summary = productSummaryText(order)
  const url = order.primaryProductImageUrl?.trim() || null
  const lineCount = order.orderLineCount ?? 0
  const showMulti = lineCount > 1

  return (
    <div className="flex items-center gap-3 min-w-0">
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-xl border-2 border-border bg-muted shadow-sm",
          "h-[52px] w-[52px] sm:h-15 sm:w-15"
        )}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element -- URLs de produto podem vir de vários hosts
          <Image src={url} alt="" width={52} height={52} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
            <ImageIcon className="h-8 w-8" aria-hidden />
          </div>
        )}
        {showMulti && (
          <span className="absolute bottom-1 right-1 rounded-md bg-background/95 px-1.5 py-0.5 text-[10px] font-bold tabular-nums shadow-sm ring-1 ring-border">
            +{lineCount - 1}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">{summary}</p>
        {order.itemsCount != null && order.itemsCount > 1 && (
          <p className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
            {order.itemsCount} un.
          </p>
        )}
      </div>
    </div>
  )
}

export function OrderList({ orders }: OrderListProps) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Desktop header */}
      <div className="hidden lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(220px,1.25fr)_minmax(0,1fr)_128px_104px_40px] border-b border-border bg-muted/50 px-4 py-2.5 gap-3">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Pedido</span>
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Produto</span>
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
              className="group flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(220px,1.25fr)_minmax(0,1fr)_128px_104px_40px] lg:items-center gap-3 lg:gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors"
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
                </div>
              </div>

              {/* Product (destaque) — antes do cliente */}
              <div className="min-w-0 lg:pr-1">
                <OrderProductPreview order={order} />
              </div>

              {/* Customer — só nome/email */}
              <div className="flex flex-col min-w-0 lg:pr-2">
                <p className="text-sm font-semibold text-foreground truncate">
                  {customerDisplay(order.customer)}
                </p>
                {customerEmail(order.customer) && (
                  <p className="text-xs text-muted-foreground truncate">
                    {customerEmail(order.customer)}
                  </p>
                )}
              </div>

              {/* Fulfillment status */}
              <div className="flex items-center gap-2 flex-wrap lg:justify-start">
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
