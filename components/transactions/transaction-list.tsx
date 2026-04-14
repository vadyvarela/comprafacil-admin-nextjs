"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { PaymentIntent } from "@/lib/graphql/transactions/types"
import { formatCurrency } from "@/lib/utils/currency"
import { cn } from "@/lib/utils"
import { CreditCard, User, Calendar } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TransactionDetailSheet } from "./transaction-detail-sheet"

type TransactionListProps = {
  transactions: PaymentIntent[]
  gatewayOrigin?: string | null
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  try {
    return format(new Date(iso), "dd/MM/yyyy HH:mm", { locale: ptBR })
  } catch {
    return "—"
  }
}

function customerDisplay(customer: PaymentIntent["customer"]): string {
  if (!customer) return "—"
  if (customer.name?.trim()) return customer.name.trim()
  if (customer.email?.trim()) return customer.email.trim()
  return "—"
}

function shortId(id: string): string {
  if (!id || id.length < 8) return id
  return `${id.slice(0, 8)}…`
}

function productTitle(tx: PaymentIntent): string {
  const line = tx.checkoutSession?.lines?.[0]
  const title = line?.productVariant?.product?.title || line?.productVariant?.title
  return title || "—"
}

function quantity(tx: PaymentIntent): string {
  const line = tx.checkoutSession?.lines?.[0]
  if (!line) return "—"
  return String(line.quantity ?? "—")
}

function statusClass(code: string): string {
  const c = code?.toUpperCase() ?? ""
  if (["PS", "COMPLETED", "CAPTURED", "PAID"].some((x) => c.includes(x))) return "badge-success"
  if (["ERROR", "CANCELED", "FAILED", "REJECTED"].some((x) => c.includes(x))) return "badge-danger"
  if (c.includes("PENDING") || c.includes("PROCESSING")) return "badge-warning"
  if (c.includes("AUTHORIZED")) return "badge-info"
  return "badge-neutral"
}

function StatusBadge({ tx }: { tx: PaymentIntent }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium cursor-default ${statusClass(tx.status?.code ?? "")}`}
        >
          {tx.status?.code ?? "—"}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">
        <div className="max-w-xs text-left space-y-0.5">
          <p className="font-medium">{tx.status?.code ?? "—"}</p>
          {tx.status?.description && (
            <p className="text-[11px] leading-snug">{tx.status.description}</p>
          )}
          {tx.statusReason && (
            <p className="text-[11px] leading-snug text-muted">Motivo: {tx.statusReason}</p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

export function TransactionList({ transactions, gatewayOrigin = null }: TransactionListProps) {
  const router = useRouter()
  const [selected, setSelected] = useState<PaymentIntent | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  function openDetail(tx: PaymentIntent) {
    router.push(`/dashboard/transactions?id=${tx.id}`)
  }

  const columns = [
    {
      id: "amount",
      header: "Valor",
      headerClassName: "text-right w-[120px]",
      cellClassName: "text-right tabular-nums font-semibold text-foreground",
      render: (tx: PaymentIntent) => formatCurrency(tx.amount, tx.currency),
    },
    {
      id: "customer",
      header: "Cliente",
      headerClassName: "text-left min-w-[160px]",
      cellClassName: "text-left text-foreground max-w-[200px] truncate",
      render: (tx: PaymentIntent) => customerDisplay(tx.customer),
    },
    {
      id: "product",
      header: "Produto",
      headerClassName: "text-left min-w-[160px]",
      cellClassName: "text-left text-muted-foreground max-w-[220px] truncate",
      render: (tx: PaymentIntent) => productTitle(tx),
    },
    {
      id: "quantity",
      header: "Qtde",
      headerClassName: "text-center w-[70px]",
      cellClassName: "text-center tabular-nums text-xs text-muted-foreground",
      render: (tx: PaymentIntent) => quantity(tx),
    },
    {
      id: "status",
      header: "Estado",
      headerClassName: "text-left w-[140px]",
      cellClassName: "text-left",
      render: (tx: PaymentIntent) => <StatusBadge tx={tx} />,
    },
    {
      id: "reference",
      header: "Referência",
      headerClassName: "text-left min-w-[130px]",
      cellClassName: "text-left text-muted-foreground tabular-nums text-xs",
      render: (tx: PaymentIntent) => tx.merchantReference || "—",
    },
    {
      id: "createdAt",
      header: "Criado em",
      headerClassName: "text-left w-[140px]",
      cellClassName: "text-left text-muted-foreground tabular-nums text-xs",
      render: (tx: PaymentIntent) => formatDate(tx.createdAt),
    },
    {
      id: "capturedAt",
      header: "Capturado em",
      headerClassName: "text-left w-[140px]",
      cellClassName: "text-left text-muted-foreground tabular-nums text-xs",
      render: (tx: PaymentIntent) => formatDate(tx.capturedAt),
    },
  ] as const

  return (
    <>
      <div>
        {/* Desktop */}
        <div className="hidden lg:block rounded-xl border border-border overflow-hidden bg-card shadow-sm">
          <Table role="grid" aria-label="Lista de transações">
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                {columns.map((col) => (
                  <TableHead key={col.id} className={cn(col.headerClassName, "text-xs font-semibold text-muted-foreground")}>
                    {col.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow
                  key={tx.id}
                  className="border-border hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => openDetail(tx)}
                >
                  {columns.map((col) => (
                    <TableCell key={col.id} className={col.cellClassName}>
                      {col.render(tx)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile */}
        <div className="lg:hidden space-y-2">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="rounded-xl border border-border bg-card p-4 shadow-sm cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => openDetail(tx)}
            >
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <CreditCard className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="font-mono text-xs font-semibold text-foreground">
                      #{shortId(tx.id)}
                    </span>
                    <StatusBadge tx={tx} />
                  </div>
                  <p className="text-sm font-bold tabular-nums text-foreground mb-1">
                    {formatCurrency(tx.amount, tx.currency)}
                  </p>
                  <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                    {(tx.customer?.name || tx.customer?.email) && (
                      <span className="flex items-center gap-1 truncate">
                        <User className="h-3 w-3 shrink-0" />
                        {customerDisplay(tx.customer)}
                      </span>
                    )}
                    <span className="flex items-center gap-1 tabular-nums">
                      <Calendar className="h-3 w-3 shrink-0" />
                      {formatDate(tx.createdAt)}
                    </span>
                    {tx.merchantReference && (
                      <span className="truncate text-muted-foreground/70">Ref: {tx.merchantReference}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <TransactionDetailSheet
        tx={selected}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        gatewayOrigin={gatewayOrigin}
      />
    </>
  )
}
