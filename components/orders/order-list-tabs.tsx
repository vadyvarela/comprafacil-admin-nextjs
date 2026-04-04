"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import type { OrdersTab } from "@/lib/orders/types"

const TABS: {
  value: OrdersTab
  label: string
  dot?: string
}[] = [
  { value: "all", label: "Todos" },
  { value: "PENDING", label: "A processar", dot: "bg-amber-500" },
  { value: "PREPARING", label: "Em preparação", dot: "bg-blue-500" },
  { value: "SHIPPED", label: "Enviado", dot: "bg-indigo-500" },
  { value: "DELIVERED", label: "Entregue", dot: "bg-emerald-500" },
  { value: "CANCELLED", label: "Cancelado", dot: "bg-red-400" },
]

type OrderListTabsProps = {
  currentTab: OrdersTab
}

export function OrderListTabs({ currentTab }: OrderListTabsProps) {
  const searchParams = useSearchParams()

  function buildUrl(tab: OrdersTab) {
    const p = new URLSearchParams(searchParams.toString())
    p.set("tab", tab)
    p.set("page", "0")
    return `?${p.toString()}`
  }

  return (
    <nav
      aria-label="Filtrar pedidos por estado"
      className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-none"
    >
      {TABS.map(({ value, label, dot }) => {
        const isActive = currentTab === value
        return (
          <Link
            key={value}
            href={buildUrl(value)}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
            )}
          >
            {dot && (
              <span className={cn("h-1.5 w-1.5 rounded-full", isActive ? "bg-white/70" : dot)} />
            )}
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
