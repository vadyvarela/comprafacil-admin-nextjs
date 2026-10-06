"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Search, ShoppingCart, X, CalendarDays } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ClearFiltersButton } from "@/components/admin/clear-filters-button"
import { useState } from "react"
import { PageToolbar } from "@/components/admin/page-toolbar"
import { LoadError } from "@/components/admin/load-error"
import { getFulfillmentStatusLabel } from "@/lib/orders/status"
import type { OrdersTab } from "@/lib/orders/types"

type OrderListToolbarProps = {
  totalElements: number
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

  const countLabel = `${totalElements.toLocaleString("pt-PT")} pedido${totalElements !== 1 ? "s" : ""} pago${totalElements !== 1 ? "s" : ""}`

  return (
    <PageToolbar
      icon={ShoppingCart}
      iconBg="bg-info-soft"
      iconColor="text-info-strong"
      title="Pedidos"
      subtitle={
        <>
          <span>{countLabel}</span>
          {hasFulfillmentFilter ? <span>· {getFulfillmentStatusLabel(currentTab)}</span> : null}
          {hasDateFilter ? <span className="font-semibold text-primary">· no período</span> : null}
        </>
      }
      footer={
        <>
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
                aria-label="Data inicial"
                className="h-auto border-0 p-0 text-xs bg-transparent focus-visible:ring-0 w-28 text-foreground"
              />
              <span className="text-xs text-muted-foreground">–</span>
              <Input
                type="date"
                value={toVal}
                onChange={(e) => setToVal(e.target.value)}
                aria-label="Data final"
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
          {error ? <LoadError title="Erro ao carregar pedidos" message={error} /> : null}
        </>
      }
    >
      <form method="GET" className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto" role="search">
        <input type="hidden" name="page" value="0" />
        {currentTab !== "all" && <input type="hidden" name="tab" value={currentTab} />}
        {dateFrom && <input type="hidden" name="from" value={dateFrom} />}
        {dateTo && <input type="hidden" name="to" value={dateTo} />}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            name="search"
            placeholder="Referência, cliente…"
            aria-label="Pesquisar pedidos"
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
    </PageToolbar>
  )
}
