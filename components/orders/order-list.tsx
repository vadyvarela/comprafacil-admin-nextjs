"use client"

import Link from "next/link"
import {
  ShoppingCart,
  User,
  Calendar,
  ArrowRight,
  CreditCard,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { OrderSummary } from "@/lib/graphql/orders/types"
import {
  getOrderStatusLabel,
  getOrderStatusVariant,
} from "@/lib/orders/status"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/utils/currency"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type OrderListProps = {
  orders: OrderSummary[]
}

function formatOrderDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  try {
    return format(new Date(iso), "dd/MM/yyyy HH:mm", { locale: ptBR })
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

function shortId(id: string): string {
  if (!id || id.length < 8) return id
  return `${id.slice(0, 8)}…`
}

function productSummaryText(order: OrderSummary): string {
  if (order.productSummary?.trim()) return order.productSummary
  if (order.itemsCount && order.itemsCount > 0) return `${order.itemsCount} item(ns)`
  return "—"
}

export function OrderList({ orders }: OrderListProps) {
  const columns = [
    {
      id: "amount",
      header: "Valor",
      headerClassName: "text-right w-[110px]",
      cellClassName: "text-right font-medium tabular-nums text-foreground",
      render: (order: OrderSummary) => formatCurrency(order.totalAmount ?? 0, order.currency),
    },
    {
      id: "customer",
      header: "Cliente",
      headerClassName: "min-w-[160px]",
      cellClassName: "text-foreground max-w-[180px] truncate",
      render: (order: OrderSummary) => customerDisplay(order.customer),
    },
    {
      id: "products",
      header: "Produtos",
      headerClassName: "min-w-[200px]",
      cellClassName: "text-muted-foreground max-w-[220px] truncate",
      render: (order: OrderSummary) => productSummaryText(order),
    },
    {
      id: "itemsCount",
      header: "Qtde",
      headerClassName: "text-center w-[70px]",
      cellClassName: "text-center tabular-nums text-xs text-muted-foreground",
      render: (order: OrderSummary) =>
        order.itemsCount && order.itemsCount > 0 ? order.itemsCount : "—",
    },
    {
      id: "status",
      header: "Status",
      headerClassName: "w-[90px]",
      cellClassName: "",
      render: (order: OrderSummary) =>
        order.status ? (
          <Badge
            variant={getOrderStatusVariant(order.status.code)}
            className="text-xs font-normal"
          >
            {getOrderStatusLabel(order.status.code)}
          </Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: "reference",
      header: "Ref.",
      headerClassName: "w-[110px]",
      cellClassName: "",
      render: (order: OrderSummary) => (
        <Link
          href={`/dashboard/orders/${order.id}`}
          className="font-mono text-[11px] font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded"
        >
          {shortId(order.id)}
        </Link>
      ),
    },
    {
      id: "createdAt",
      header: "Criado em",
      headerClassName: "w-[150px]",
      cellClassName: "text-muted-foreground tabular-nums text-xs",
      render: (order: OrderSummary) => formatOrderDate(order.createdAt),
    },
    {
      id: "paymentProvider",
      header: "Pagamento",
      headerClassName: "w-[130px]",
      cellClassName: "text-muted-foreground text-xs",
      render: (order: OrderSummary) => order.paymentProviderType || "—",
    },
    {
      id: "actions",
      header: "",
      headerClassName: "w-10",
      cellClassName: "px-3",
      render: (order: OrderSummary) => (
        <Link
          href={`/dashboard/orders/${order.id}`}
          className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label={`Ver pedido ${shortId(order.id)}`}
        >
          <ArrowRight className="h-4 w-4" />
        </Link>
      ),
    },
  ] as const

  return (
    <div className="space-y-0">
      {/* Desktop: table with Valor + Produtos */}
      <div className="hidden lg:block rounded-lg border border-border overflow-hidden bg-card shadow-sm">
        <Table role="grid" aria-label="Lista de pedidos">
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.id} className={column.headerClassName}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow
                key={order.id}
                className="border-border hover:bg-accent/40 transition-colors group"
              >
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    className={column.cellClassName}
                  >
                    {column.render(order)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: cards with valor + produtos */}
      <div className="lg:hidden space-y-3">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/dashboard/orders/${order.id}`}
            className={cn(
              "block rounded-xl border border-border bg-card p-4 shadow-sm transition-all",
              "hover:border-primary/30 hover:shadow-md active:scale-[0.99]",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            )}
          >
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="font-mono text-xs font-semibold text-primary">
                    {shortId(order.id)}
                  </span>
                  {order.status && (
                    <Badge
                      variant={getOrderStatusVariant(order.status.code)}
                      className="text-xs font-normal"
                    >
                      {getOrderStatusLabel(order.status.code)}
                    </Badge>
                  )}
                </div>
                <p className="text-sm font-medium text-foreground truncate mb-0.5">
                  {productSummaryText(order)}
                </p>
                <p className="text-lg font-semibold tabular-nums text-foreground">
                  {formatCurrency(order.totalAmount ?? 0, order.currency ?? "CVE")}
                </p>
                <div className="flex flex-col gap-0.5 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5 truncate">
                    <User className="h-3.5 w-3.5 shrink-0" />
                    {customerDisplay(order.customer)}
                  </span>
                  <span className="flex items-center gap-1.5 tabular-nums">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    {formatOrderDate(order.createdAt)}
                  </span>
                  {order.paymentProviderType && (
                    <span className="flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 shrink-0" />
                      {order.paymentProviderType}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center">
                <span className="inline-flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
