"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import type { OrdersTab } from "@/lib/orders/types"

const TABS: { value: OrdersTab; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "paid", label: "Pagamento efetuado" },
  { value: "pending", label: "Pendentes" },
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
    <nav aria-label="Filtrar pedidos por estado de pagamento" className="flex border-b border-border">
      {TABS.map(({ value, label }) => (
        <Link
          key={value}
          href={buildUrl(value)}
          aria-current={currentTab === value ? "page" : undefined}
          className={cn(
            "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
            currentTab === value
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50"
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}
