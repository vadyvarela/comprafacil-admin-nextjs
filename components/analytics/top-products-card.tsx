import Link from "next/link"
import { Package, ArrowRight } from "lucide-react"
import { formatCurrency } from "@/lib/utils/currency"

interface TopProduct {
  name: string
  revenue: number
  qty: number
}

interface TopProductsCardProps {
  products: TopProduct[]
}

export function TopProductsCard({ products }: TopProductsCardProps) {
  const maxRevenue = products[0]?.revenue ?? 1

  return (
    <div className="rounded-lg border border-border/80 bg-card shadow-none overflow-hidden animate-enter">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Package className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">Produtos mais vendidos</span>
        </div>
        <Link
          href="/dashboard/products"
          className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
        >
          Ver todos <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="px-5 py-3">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Package className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground">Sem dados de vendas</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {products.map((p, i) => {
              const pct = Math.round((p.revenue / maxRevenue) * 100)
              return (
                <div key={`${p.name}-${i}`} className="py-3">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-[11px] font-bold tabular-nums text-muted-foreground shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                      <p className="text-[11px] text-muted-foreground">{p.qty} un.</p>
                    </div>
                    <span className="text-sm font-bold tabular-nums text-foreground shrink-0 font-mono">
                      {formatCurrency(p.revenue)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden ml-10">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
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
