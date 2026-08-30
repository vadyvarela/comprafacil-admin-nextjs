"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Search, ShoppingCart, X, CalendarDays } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ClearFiltersButton } from "@/components/admin/clear-filters-button"
import { useState } from "react"
import type { OrdersTab } from "@/lib/orders/types"

type OrderListToolbarProps = {
  totalElements: number
  visibleCount: number
  currentTab: OrdersTab
  error?: string | null
  dateFrom?: string
  dateTo?: string
}

const DATE_PRESETS = [
  { label: "7 dias", days: 7 },
  { label: "30 dias", days: 30 },
  { label: "90 dias", days: 90 },
]

function toDateInput(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function OrderListToolbar({
  totalElements,
  visibleCount,
  currentTab,
  error,
  dateFrom,
  dateTo,
}: OrderListToolbarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const search = searchParams.get("search") ?? ""
  const [fromVal, setFromVal] = useState(dateFrom ?? "")
  const [toVal, setToVal] = useState(dateTo ?? "")

  const buildParams = (overrides: Record<string, string | null>) => {
    const p = new URLSearchParams(searchParams.toString())
    p.set("page", "0")
    for (const [k, v] of Object.entries(overrides)) {
      if (v === null || v === "") p.delete(k)
      else p.set(k, v)
    }
    return p.toString()
  }

  const applyDateFilter = (f: string, t: string) => {
    router.push(`?${buildParams({ from: f || null, to: t || null })}`)
  }

  const applyPreset = (days: number) => {
    const t = new Date()
    const f = new Date()
    f.setDate(f.getDate() - days + 1)
    const fStr = toDateInput(f)
    const tStr = toDateInput(t)
    setFromVal(fStr)
    setToVal(tStr)
    applyDateFilter(fStr, tStr)
  }

  const clearDates = () => {
    setFromVal("")
    setToVal("")
    router.push(`?${buildParams({ from: null, to: null })}`)
  }

  const hasDateFilter = dateFrom || dateTo
  const hasFulfillmentFilter = currentTab !== "all"
  const hasActiveFilters = Boolean(search || dateFrom || dateTo || hasFulfillmentFilter)

  return (
    <div className="sticky top-12 z-30 border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="space-y-3 px-4 py-3 md:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border/60 bg-blue-50">
              <ShoppingCart className="h-4 w-4 text-blue-700" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground">Pedidos</h1>
              <p className="text-[11px] text-muted-foreground">
                {hasFulfillmentFilter
                  ? `${visibleCount.toLocaleString("pt-PT")} pedido${visibleCount !== 1 ? "s" : ""} nesta página`
                  : `${totalElements.toLocaleString("pt-PT")} pedido${totalElements !== 1 ? "s" : ""} com pagamento efetuado`}
                {hasFulfillmentFilter && (
                  <span className="ml-1">
                    · {totalElements.toLocaleString("pt-PT")} pago{totalElements !== 1 ? "s" : ""} no período
                  </span>
                )}
                {hasDateFilter && <span className="ml-1 text-primary font-semibold">· filtrado</span>}
              </p>
            </div>
          </div>

          {/* Search */}
          <form method="GET" className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto" role="search">
            <input type="hidden" name="page" value="0" />
            {dateFrom && <input type="hidden" name="from" value={dateFrom} />}
            {dateTo && <input type="hidden" name="to" value={dateTo} />}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                name="search"
                placeholder="Referência, cliente…"
                defaultValue={search}
                className="pl-8 h-8 text-xs pr-8"
              />
              {search && (
                <button
                  type="button"
                  aria-label="Limpar pesquisa"
                  title="Limpar pesquisa"
                  onClick={() => {
                    const p = new URLSearchParams(searchParams.toString())
                    p.delete("search")
                    p.set("page", "0")
                    router.push(`?${p.toString()}`)
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Button type="submit" size="sm" className="h-8 px-3 text-xs sm:w-auto">
              Buscar
            </Button>
            {hasActiveFilters ? <ClearFiltersButton href="/dashboard/orders" /> : null}
          </form>
        </div>

        {/* Date filter row */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" />
            <span className="font-medium">Período:</span>
          </div>
          {DATE_PRESETS.map((p) => (
            <button
              key={p.days}
              onClick={() => applyPreset(p.days)}
              className="rounded-md border border-border/80 bg-card px-2.5 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground"
            >
              {p.label}
            </button>
          ))}
          <div className="flex min-h-8 flex-wrap items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 sm:flex-nowrap">
            <Input
              type="date"
              value={fromVal}
              onChange={(e) => setFromVal(e.target.value)}
              className="h-auto border-0 p-0 text-xs bg-transparent focus-visible:ring-0 w-28 text-foreground"
            />
            <span className="text-xs text-muted-foreground">–</span>
            <Input
              type="date"
              value={toVal}
              onChange={(e) => setToVal(e.target.value)}
              className="h-auto border-0 p-0 text-xs bg-transparent focus-visible:ring-0 w-28 text-foreground"
            />
          </div>
          <Button
            size="sm"
            className="h-8 px-3 text-xs"
            onClick={() => applyDateFilter(fromVal, toVal)}
            disabled={!fromVal && !toVal}
          >
            Aplicar
          </Button>
          {hasDateFilter && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={clearDates}
              aria-label="Limpar datas"
              title="Limpar datas"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="mx-5 mb-3 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs">
          <div className="flex-1">
            <p className="font-semibold text-destructive">Erro ao carregar pedidos</p>
            <p className="text-muted-foreground mt-0.5">{error}</p>
          </div>
          <Button variant="outline" size="sm" className="h-7 text-xs shrink-0" onClick={() => router.refresh()}>
            Tentar novamente
          </Button>
        </div>
      )}
    </div>
  )
}
