import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import type { PaymentIntent } from "@/lib/graphql/transactions/types"
import { formatCurrency } from "@/lib/utils/currency"
import { cn } from "@/lib/utils"
import { CreditCard, User, Calendar, ArrowRight } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type TransactionListProps = {
  transactions: PaymentIntent[]
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

function statusVariant(code: string): "default" | "secondary" | "destructive" | "outline" {
  const paid = ["PS", "Completed", "CAPTURED", "PAID"]
  const failed = ["Error", "CANCELED", "FAILED", "REJECTED"]
  if (paid.some((c) => code?.toUpperCase().includes(c))) return "default"
  if (failed.some((c) => code?.toUpperCase().includes(c))) return "destructive"
  return "secondary"
}

export function TransactionList({ transactions }: TransactionListProps) {
  const columns = [
    {
      id: "amount",
      header: "Valor",
      headerClassName: "text-right w-[120px]",
      cellClassName: "text-right tabular-nums font-medium",
      render: (tx: PaymentIntent) => formatCurrency(tx.amount, tx.currency),
    },
    {
      id: "customer",
      header: "Cliente",
      headerClassName: "text-left min-w-[160px]",
      cellClassName: "text-left text-muted-foreground max-w-[200px] truncate",
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
      headerClassName: "text-center w-[80px]",
      cellClassName: "text-center tabular-nums text-xs",
      render: (tx: PaymentIntent) => quantity(tx),
    },
    {
      id: "status",
      header: "Estado",
      headerClassName: "text-left w-[110px]",
      cellClassName: "text-left",
      render: (tx: PaymentIntent) => (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant={statusVariant(tx.status?.code ?? "")}
              className="text-xs font-normal cursor-default"
            >
              {tx.status?.code ?? "—"}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top">
            <div className="max-w-xs text-left space-y-0.5">
              <p className="font-medium">
                {tx.status?.code ?? "—"}
              </p>
              {tx.status?.description && (
                <p className="text-[11px] leading-snug">
                  {tx.status.description}
                </p>
              )}
              {tx.statusReason && (
                <p className="text-[11px] leading-snug text-muted">
                  Motivo: {tx.statusReason}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      ),
    },
    {
      id: "reference",
      header: "Referência",
      headerClassName: "text-left min-w-[140px]",
      cellClassName: "text-left text-muted-foreground tabular-nums",
      render: (tx: PaymentIntent) => tx.merchantReference || "—",
    },
    {
      id: "createdAt",
      header: "Criado em",
      headerClassName: "text-left w-[150px]",
      cellClassName: "text-left text-muted-foreground tabular-nums",
      render: (tx: PaymentIntent) => formatDate(tx.createdAt),
    },
    {
      id: "updatedAt",
      header: "Atualizado em",
      headerClassName: "text-left w-[150px]",
      cellClassName: "text-left text-muted-foreground tabular-nums",
      render: (tx: PaymentIntent) => formatDate(tx.updatedAt),
    },
    {
      id: "capturedAt",
      header: "Capturado em",
      headerClassName: "text-left w-[150px]",
      cellClassName: "text-left text-muted-foreground tabular-nums",
      render: (tx: PaymentIntent) => formatDate(tx.capturedAt),
    },
  ] as const

  return (
    <div className="space-y-0">
      <div className="hidden lg:block rounded-md border overflow-hidden">
        <Table role="grid" aria-label="Lista de transações">
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
            {transactions.map((tx) => (
              <TableRow key={tx.id}>
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    className={column.cellClassName}
                  >
                    {column.render(tx)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="lg:hidden space-y-2">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className={cn(
              "rounded-lg border bg-card p-3 transition-colors"
            )}
          >
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-mono text-xs font-medium text-foreground">
                    {shortId(tx.id)}
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant={statusVariant(tx.status?.code ?? "")}
                        className="text-xs font-normal cursor-default"
                      >
                        {tx.status?.code ?? "—"}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <div className="max-w-xs text-left space-y-0.5">
                        <p className="font-medium">
                          {tx.status?.code ?? "—"}
                        </p>
                        {tx.status?.description && (
                          <p className="text-[11px] leading-snug">
                            {tx.status.description}
                          </p>
                        )}
                        {tx.statusReason && (
                          <p className="text-[11px] leading-snug text-muted">
                            Motivo: {tx.statusReason}
                          </p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="text-sm font-medium tabular-nums mb-1">
                  {formatCurrency(tx.amount, tx.currency)}
                </div>
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
                    <span className="truncate">Ref: {tx.merchantReference}</span>
                  )}
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" aria-hidden />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
