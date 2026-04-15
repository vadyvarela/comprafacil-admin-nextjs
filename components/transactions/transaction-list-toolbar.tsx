"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Search, CreditCard, X, CalendarDays } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useRef } from "react"

const STATUS_TABS = [
  { label: "Todas", value: "" },
  { label: "Autorizada", value: "AUTHORIZED" },
  { label: "Capturada", value: "CAPTURED" },
  { label: "Pendente", value: "PENDING" },
  { label: "Cancelada", value: "CANCELLED" },
  { label: "Falhada", value: "FAILED" },
]

const DATE_PRESETS = [
  { label: "7 dias", days: 7 },
  { label: "30 dias", days: 30 },
  { label: "90 dias", days: 90 },
]

type TransactionListToolbarProps = {
  totalElements: number
  search?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  error?: string | null
}

export function TransactionListToolbar({
  totalElements,
  search = "",
  status = "",
  dateFrom = "",
  dateTo = "",
  error,
}: TransactionListToolbarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromRef = useRef<HTMLInputElement>(null)
  const toRef = useRef<HTMLInputElement>(null)

  function navigate(overrides: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", "0")
    for (const [k, v] of Object.entries(overrides)) {
      if (v) params.set(k, v)
      else params.delete(k)
    }
    router.push(`?${params.toString()}`)
  }

  function applyDates() {
    const from = fromRef.current?.value ?? ""
    const to = toRef.current?.value ?? ""
    navigate({ from, to })
  }

  function applyPreset(days: number) {
    const to = new Date()
    const from = new Date()
    from.setDate(from.getDate() - days)
    navigate({
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
    })
  }

  function clearDates() {
    navigate({ from: "", to: "" })
  }

  const hasDateFilter = dateFrom || dateTo

  return (
    <div className="border-b border-border bg-background/60 backdrop-blur-sm sticky top-14 z-30">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
            <CreditCard className="h-4.5 w-4.5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-foreground">Transações</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {totalElements} transaç{totalElements !== 1 ? "ões" : "ão"} registadas
            </p>
          </div>
        </div>

        {/* Search */}
        <form method="GET" className="flex gap-2" role="search">
          <input type="hidden" name="page" value="0" />
          {status && <input type="hidden" name="status" value={status} />}
          {dateFrom && <input type="hidden" name="from" value={dateFrom} />}
          {dateTo && <input type="hidden" name="to" value={dateTo} />}
          <div className="relative w-56 sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input name="q" placeholder="Ref., cliente…" defaultValue={search} className="pl-8 h-8 text-xs" />
          </div>
          <Button type="submit" size="sm" className="h-8 text-xs">Buscar</Button>
        </form>
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-1 px-5 pb-2 overflow-x-auto">
        {STATUS_TABS.map((tab) => {
          const active = status === tab.value
          return (
            <button
              key={tab.value}
              onClick={() => navigate({ status: tab.value, q: search })}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Date filter row */}
      <div className="flex flex-wrap items-center gap-2 px-5 pb-3">
        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        {DATE_PRESETS.map((p) => (
          <button
            key={p.days}
            onClick={() => applyPreset(p.days)}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
          >
            {p.label}
          </button>
        ))}
        <div className="flex items-center gap-1.5">
          <input
            ref={fromRef}
            type="date"
            defaultValue={dateFrom}
            className="h-7 px-2 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
          <span className="text-xs text-muted-foreground">—</span>
          <input
            ref={toRef}
            type="date"
            defaultValue={dateTo}
            className="h-7 px-2 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
          <Button size="sm" variant="outline" className="h-7 text-xs px-3" onClick={applyDates}>
            Aplicar
          </Button>
          {hasDateFilter && (
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground" onClick={clearDates}>
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        {hasDateFilter && (
          <span className="text-xs text-primary font-medium">
            {dateFrom} → {dateTo || "hoje"}
          </span>
        )}
      </div>

      {error && (
        <div className="mx-5 mb-3 p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-xs">
          <p className="font-semibold text-destructive mb-1">Erro ao carregar</p>
          <p className="text-muted-foreground mb-2">{error}</p>
          <Button variant="outline" size="sm" onClick={() => router.refresh()}>Tentar novamente</Button>
        </div>
      )}
    </div>
  )
}
