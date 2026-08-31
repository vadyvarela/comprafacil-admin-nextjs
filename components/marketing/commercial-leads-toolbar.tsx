"use client"

import { useRef } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { AlarmClock, CalendarDays, PhoneCall, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ClearFiltersButton } from "@/components/admin/clear-filters-button"
import type { CommercialLeadFollowUpStatus } from "@/lib/graphql/commercial-leads/types"
import { FOLLOW_UP_STATUS_OPTIONS } from "./commercial-lead-helpers"

const STATUS_TABS: { label: string; value: "" | CommercialLeadFollowUpStatus }[] = [
  { label: "Activos", value: "" },
  ...FOLLOW_UP_STATUS_OPTIONS,
]

const DATE_PRESETS = [
  { label: "7 dias", days: 7 },
  { label: "30 dias", days: 30 },
  { label: "90 dias", days: 90 },
]

type CommercialLeadsToolbarProps = {
  totalElements: number
  search?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  dueOnly?: boolean
  error?: string | null
}

export function CommercialLeadsToolbar({
  totalElements,
  search = "",
  status = "",
  dateFrom = "",
  dateTo = "",
  dueOnly = false,
  error,
}: CommercialLeadsToolbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const fromRef = useRef<HTMLInputElement>(null)
  const toRef = useRef<HTMLInputElement>(null)

  function navigate(overrides: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", "0")
    for (const [key, value] of Object.entries(overrides)) {
      if (value) params.set(key, value)
      else params.delete(key)
    }
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  function applyDates() {
    navigate({
      from: fromRef.current?.value ?? "",
      to: toRef.current?.value ?? "",
    })
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

  const hasDateFilter = Boolean(dateFrom || dateTo)
  const hasActiveFilters = Boolean(search || status || dateFrom || dateTo || dueOnly)

  return (
    <div className="sticky top-12 z-30 border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="flex flex-col gap-3 px-4 py-3 md:px-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50">
            <PhoneCall className="h-4 w-4 text-emerald-700" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">Leads</h1>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {totalElements} oportunidade{totalElements !== 1 ? "s" : ""} na lista
            </p>
          </div>
        </div>

        <form
          method="GET"
          action={pathname}
          className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto"
          role="search"
        >
          <input type="hidden" name="page" value="0" />
          {status ? <input type="hidden" name="status" value={status} /> : null}
          {dateFrom ? <input type="hidden" name="from" value={dateFrom} /> : null}
          {dateTo ? <input type="hidden" name="to" value={dateTo} /> : null}
          {dueOnly ? <input type="hidden" name="due" value="1" /> : null}
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              placeholder="Cliente, telefone, produto…"
              defaultValue={search}
              className="h-8 pl-8 text-xs"
            />
          </div>
          <Button type="submit" size="sm" className="h-8 text-xs">
            Buscar
          </Button>
          {hasActiveFilters ? <ClearFiltersButton href={pathname} /> : null}
        </form>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto px-4 pb-2 md:px-5">
        {STATUS_TABS.map((tab) => {
          const active = status === tab.value
          return (
            <button
              key={tab.value || "ACTIVE"}
              type="button"
              aria-pressed={active}
              onClick={() => navigate({ status: tab.value, q: search })}
              className={
                active
                  ? "shrink-0 rounded-md bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
                  : "shrink-0 rounded-md border border-border/80 bg-card px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
              }
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 px-4 pb-3 md:px-5">
        <CalendarDays className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        {DATE_PRESETS.map((preset) => (
          <button
            key={preset.days}
            type="button"
            onClick={() => applyPreset(preset.days)}
            className="rounded-md border border-border/80 bg-card px-2.5 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
          >
            {preset.label}
          </button>
        ))}
        <div className="flex flex-wrap items-center gap-1.5">
          <input
            ref={fromRef}
            type="date"
            defaultValue={dateFrom}
            className="h-7 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/35"
          />
          <span className="text-xs text-muted-foreground">-</span>
          <input
            ref={toRef}
            type="date"
            defaultValue={dateTo}
            className="h-7 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/35"
          />
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-3 text-xs"
            onClick={applyDates}
          >
            Aplicar
          </Button>
          {hasDateFilter ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-muted-foreground"
              onClick={() => navigate({ from: "", to: "" })}
              aria-label="Limpar datas"
              title="Limpar datas"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          ) : null}
        </div>
        <Button
          type="button"
          size="sm"
          variant={dueOnly ? "default" : "outline"}
          className="h-7 gap-1.5 px-2.5 text-xs"
          onClick={() => navigate({ due: dueOnly ? "" : "1" })}
        >
          <AlarmClock className="h-3.5 w-3.5" />
          Vencidos
        </Button>
      </div>

      {error ? (
        <div className="mx-5 mb-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs">
          <p className="mb-1 font-semibold text-destructive">Erro ao carregar</p>
          <p className="mb-2 text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={() => router.refresh()}>
            Tentar novamente
          </Button>
        </div>
      ) : null}
    </div>
  )
}
