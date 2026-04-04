"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import type { OrdersTab } from "@/lib/orders/types"
import { FULFILLMENT_OPTIONS } from "@/lib/orders/status"

const TABS: { value: OrdersTab; label: string; color?: string }[] = [
  { value: "all", label: "Todos" },
  { value: "PENDING", label: "A processar", color: "amber" },
  { value: "PREPARING", label: "Em preparação", color: "blue" },
  { value: "SHIPPED", label: "Enviado", color: "cyan" },
  { value: "DELIVERED", label: "Entregue", color: "emerald" },
  { value: "CANCELLED", label: "Cancelado", color: "red" },
]

type OrderListTabsProps = {
  currentTab: OrdersTab
}

const activeColorMap: Record<string, string> = {
  amber: "border-amber-500 text-amber-700",
  blue: "border-blue-500 text-blue-700",
  cyan: "border-cyan-500 text-cyan-700",
  emerald: "border-emerald-500 text-emerald-700",
  red: "border-red-500 text-red-700",
}

const dotColorMap: Record<string, string> = {
  amber: "bg-amber-500",
  blue: "bg-blue-500",
  cyan: "bg-cyan-500",
  emerald: "bg-emerald-500",
  red: "bg-red-500",
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
      className="flex gap-1 overflow-x-auto pb-0.5"
    >
      {TABS.map(({ value, label, color }) => {
        const isActive = currentTab === value
        const activeClass = color ? activeColorMap[color] : "border-primary text-primary"
        const dotClass = color ? dotColorMap[color] : "bg-primary"

        return (
          <Link
            key={value}
            href={buildUrl(value)}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
              isActive
                ? `${activeClass} border-current bg-current/5`
                : "border-border text-muted-foreground bg-card hover:text-foreground hover:border-border/80 hover:bg-accent/50"
            )}
          >
            {color && isActive && (
              <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
            )}
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
