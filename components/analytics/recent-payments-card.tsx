import Link from "next/link"
import { CreditCard, ArrowRight } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { formatCurrency } from "@/lib/utils/currency"

interface RecentPayment {
  id: string
  customerName: string
  amount: number
  currency: string
  date: string | null
  reference: string | null
}

interface RecentPaymentsCardProps {
  payments: RecentPayment[]
}

export function RecentPaymentsCard({ payments }: RecentPaymentsCardProps) {
  return (
    <div className="rounded-lg border border-border/80 bg-card shadow-none overflow-hidden animate-enter">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <CreditCard className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">Pagamentos recentes</span>
        </div>
        <Link
          href="/dashboard/transactions"
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          Ver todas <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="px-5 py-2">
        {payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CreditCard className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground">Sem pagamentos no período</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {payment.customerName}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {payment.reference ?? payment.id.slice(0, 8)}
                    {payment.date && (
                      <span className="ml-2">
                        {format(new Date(payment.date), "dd MMM, HH:mm", { locale: ptBR })}
                      </span>
                    )}
                  </p>
                </div>
                <span className="text-sm font-bold tabular-nums text-foreground shrink-0 font-mono">
                  {formatCurrency(payment.amount, payment.currency)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
