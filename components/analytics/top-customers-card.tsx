import Link from "next/link"
import { Users, ArrowRight } from "lucide-react"
import { formatCurrency } from "@/lib/utils/currency"

interface TopCustomer {
  name: string
  revenue: number
}

interface TopCustomersCardProps {
  customers: TopCustomer[]
}

export function TopCustomersCard({ customers }: TopCustomersCardProps) {
  const maxRevenue = customers[0]?.revenue ?? 1

  return (
    <div className="rounded-lg border border-border/80 bg-card shadow-none overflow-hidden animate-enter">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">Top clientes</span>
        </div>
        <Link
          href="/dashboard/customers"
          className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
        >
          Ver todos <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="px-5 py-3">
        {customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Users className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground">Sem clientes no período</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {customers.map((c, i) => {
              const pct = Math.round((c.revenue / maxRevenue) * 100)
              return (
                <div key={`${c.name}-${i}`} className="py-3">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-[11px] font-bold tabular-nums text-muted-foreground shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                    </div>
                    <span className="text-sm font-bold tabular-nums text-foreground shrink-0 font-mono">
                      {formatCurrency(c.revenue)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden ml-10">
                    <div
                      className="h-full rounded-full bg-violet-500 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
