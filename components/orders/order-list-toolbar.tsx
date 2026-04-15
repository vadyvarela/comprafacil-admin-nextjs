"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Search, ShoppingCart, X, CalendarDays } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState } from "react"

type OrderListToolbarProps = {
  totalElements: number
  error?: string | null
  dateFrom?: string
  dateTo?: string
}

const DATE_PRESETS = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
]

function toDateInput(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function OrderListToolbar({ totalElements, error, dateFrom, dateTo }: OrderListToolbarProps) {
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

  return (
    <div className="border-b border-border bg-background/60 backdrop-blur-sm sticky top-14 z-30">
      <div className="px-5 py-3.5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
              <ShoppingCart className="h-4.5 w-4.5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-foreground">Pedidos</h1>
              <p className="text-xs text-muted-foreground">
                {totalElements.toLocaleString("pt-PT")} pedido{totalElements !== 1 ? "s" : ""} com pagamento efetuado
                {hasDateFilter && <span className="ml-1 text-primary font-semibold">· filtrado</span>}
              </p>
            </div>
          </div>

          {/* Search */}
          <form method="GET" className="flex gap-2" role="search">
            <input type="hidden" name="page" value="0" />
            {dateFrom && <input type="hidden" name="from" value={dateFrom} />}
            {dateTo && <input type="hidden" name="to" value={dateTo} />}
            <div className="relative w-56 sm:w-72">
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
            <Button type="submit" size="sm" className="h-8 text-xs px-3">
              Buscar
            </Button>
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
              className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-border bg-card hover:bg-muted hover:border-primary/30 transition-colors text-muted-foreground hover:text-foreground"
            >
              {p.label}
            </button>
          ))}
          <div className="flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5">
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
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={clearDates} title="Limpar datas">
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="mx-5 mb-3 p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-xs flex items-start gap-2">
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
