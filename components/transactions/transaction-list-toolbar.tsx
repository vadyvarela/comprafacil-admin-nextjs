"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Search, CreditCard, X, CalendarDays } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ClearFiltersButton } from "@/components/admin/clear-filters-button"
import { useRef } from "react"

/** Códigos alinhados a `PaymentIntentStatusEnum` no payment-gateway (coluna `status`). */
const STATUS_TABS = [
  { label: "Todas", value: "" },
  { label: "Sucesso", value: "PS" },
  { label: "Processando", value: "PP" },
  { label: "Requer confirmação", value: "RPC" },
  { label: "Requer método", value: "RPM" },
  { label: "Requer ação", value: "RA" },
  { label: "Falhou", value: "PF" },
  { label: "Cancelado", value: "PC" },
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
  const pathname = usePathname()
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
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
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
  const hasActiveFilters = Boolean(search || status || dateFrom || dateTo)

  return (
    <div className="sticky top-12 z-30 border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="flex flex-col gap-3 px-4 py-3 md:px-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border/60 bg-emerald-50">
            <CreditCard className="h-4 w-4 text-emerald-700" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">Transações</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {totalElements} transaç{totalElements !== 1 ? "ões" : "ão"} registadas
            </p>
          </div>
        </div>

        {/* Search */}
        <form method="GET" action={pathname} className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto" role="search">
          <input type="hidden" name="page" value="0" />
          {status && <input type="hidden" name="status" value={status} />}
          {dateFrom && <input type="hidden" name="from" value={dateFrom} />}
          {dateTo && <input type="hidden" name="to" value={dateTo} />}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input name="q" placeholder="Ref., cliente…" defaultValue={search} className="pl-8 h-8 text-xs" />
          </div>
          <Button type="submit" size="sm" className="h-8 text-xs">Buscar</Button>
          {hasActiveFilters ? <ClearFiltersButton href={pathname} /> : null}
        </form>
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-1 overflow-x-auto px-4 pb-2 md:px-5">
        {STATUS_TABS.map((tab) => {
          const active = status === tab.value
          return (
            <button
              key={tab.value}
              type="button"
              aria-pressed={active}
              onClick={() => navigate({ status: tab.value, q: search })}
              className={`shrink-0 rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "border border-border/80 bg-card text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Date filter row */}
      <div className="flex flex-wrap items-center gap-2 px-4 pb-3 md:px-5">
        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        {DATE_PRESETS.map((p) => (
          <button
            key={p.days}
            onClick={() => applyPreset(p.days)}
            className="rounded-md border border-border/80 bg-card px-2.5 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
          >
            {p.label}
          </button>
        ))}
        <div className="flex flex-wrap items-center gap-1.5">
          <input
            ref={fromRef}
            type="date"
            defaultValue={dateFrom}
            className="h-7 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/35"
          />
          <span className="text-xs text-muted-foreground">—</span>
          <input
            ref={toRef}
            type="date"
            defaultValue={dateTo}
            className="h-7 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/35"
          />
          <Button size="sm" variant="outline" className="h-7 text-xs px-3" onClick={applyDates}>
            Aplicar
          </Button>
          {hasDateFilter && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-muted-foreground"
              onClick={clearDates}
              aria-label="Limpar datas"
              title="Limpar datas"
            >
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
        <div className="mx-5 mb-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs">
          <p className="font-semibold text-destructive mb-1">Erro ao carregar</p>
          <p className="text-muted-foreground mb-2">{error}</p>
          <Button variant="outline" size="sm" onClick={() => router.refresh()}>Tentar novamente</Button>
        </div>
      )}
    </div>
  )
}
