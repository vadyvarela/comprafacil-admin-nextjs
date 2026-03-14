import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import type { PaymentIntent } from "@/lib/graphql/transactions/types"
import { cn } from "@/lib/utils"
import { CreditCard, User, Calendar, ArrowRight } from "lucide-react"

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

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "CVE",
  }).format(amount / 100)
}

function statusVariant(code: string): "default" | "secondary" | "destructive" | "outline" {
  const paid = ["PS", "Completed", "CAPTURED", "PAID"]
  const failed = ["Error", "CANCELED", "FAILED", "REJECTED"]
  if (paid.some((c) => code?.toUpperCase().includes(c))) return "default"
  if (failed.some((c) => code?.toUpperCase().includes(c))) return "destructive"
  return "secondary"
}

export function TransactionList({ transactions }: TransactionListProps) {
  return (
    <div className="space-y-0">
      <div className="hidden lg:block rounded-md border overflow-hidden">
        <table className="w-full text-sm" role="grid" aria-label="Lista de transações">
          <thead>
            <tr className="border-b bg-muted/50">
              <th scope="col" className="text-left font-medium text-muted-foreground px-4 py-2.5 w-[100px]">
                ID
              </th>
              <th scope="col" className="text-left font-medium text-muted-foreground px-4 py-2.5 min-w-[120px]">
                Ref.
              </th>
              <th scope="col" className="text-left font-medium text-muted-foreground px-4 py-2.5 min-w-[140px]">
                Cliente
              </th>
              <th scope="col" className="text-right font-medium text-muted-foreground px-4 py-2.5 w-[100px]">
                Valor
              </th>
              <th scope="col" className="text-left font-medium text-muted-foreground px-4 py-2.5 w-[100px]">
                Status
              </th>
              <th scope="col" className="text-left font-medium text-muted-foreground px-4 py-2.5 w-[140px]">
                Data
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr
                key={tx.id}
                className="border-b last:border-0 hover:bg-accent/30 transition-colors"
              >
                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                  {shortId(tx.id)}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground max-w-[140px] truncate">
                  {tx.merchantReference || "—"}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground max-w-[200px] truncate">
                  {customerDisplay(tx.customer)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums font-medium">
                  {formatAmount(tx.amount, tx.currency)}
                </td>
                <td className="px-4 py-2.5">
                  <Badge
                    variant={statusVariant(tx.status?.code ?? "")}
                    className="text-xs font-normal"
                  >
                    {tx.status?.code ?? "—"}
                  </Badge>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground tabular-nums">
                  {formatDate(tx.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
                  <Badge
                    variant={statusVariant(tx.status?.code ?? "")}
                    className="text-xs font-normal"
                  >
                    {tx.status?.code ?? "—"}
                  </Badge>
                </div>
                <div className="text-sm font-medium tabular-nums mb-1">
                  {formatAmount(tx.amount, tx.currency)}
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
