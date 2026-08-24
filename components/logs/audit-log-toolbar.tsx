"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Search, ScrollText, X, CalendarDays } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useRef } from "react"

const ENTITY_TABS = [
  { label: "Todas", value: "" },
  { label: "Pedidos", value: "CHECKOUT_SESSION" },
  { label: "Produtos", value: "PRODUCT" },
  { label: "Cupões", value: "COUPON" },
]

const ACTION_OPTIONS = [
  { label: "Todas as ações", value: "" },
  { label: "Estado de envio", value: "ORDER_FULFILLMENT_STATUS_CHANGED" },
  { label: "Produto criado", value: "PRODUCT_CREATED" },
  { label: "Produto atualizado", value: "PRODUCT_UPDATED" },
  { label: "Cupão criado", value: "COUPON_CREATED" },
  { label: "Cupão atualizado", value: "COUPON_UPDATED" },
]

const DATE_PRESETS = [
  { label: "7 dias", days: 7 },
  { label: "30 dias", days: 30 },
  { label: "90 dias", days: 90 },
]

type Props = {
  totalElements: number
  search?: string
  entityType?: string
  action?: string
  dateFrom?: string
  dateTo?: string
  error?: string | null
}

export function AuditLogToolbar({
  totalElements,
  search = "",
  entityType = "",
  action = "",
  dateFrom = "",
  dateTo = "",
  error,
}: Props) {
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

  const hasDateFilter = dateFrom || dateTo

  return (
    <div className="border-b border-border bg-muted/30 sticky top-12 z-30">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 md:px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border/60 bg-slate-100">
            <ScrollText className="h-4 w-4 text-slate-700" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-foreground">
              Logs
            </h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {totalElements} evento{totalElements !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <form method="GET" action={pathname} className="flex gap-2" role="search">
          <input type="hidden" name="page" value="0" />
          {entityType ? <input type="hidden" name="entity" value={entityType} /> : null}
          {action ? <input type="hidden" name="action" value={action} /> : null}
          {dateFrom ? <input type="hidden" name="from" value={dateFrom} /> : null}
          {dateTo ? <input type="hidden" name="to" value={dateTo} /> : null}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={search}
              placeholder="Pesquisar…"
              className="h-8 w-48 pl-8 text-xs md:w-56"
            />
          </div>
          <Button type="submit" size="sm" variant="secondary" className="h-8 text-xs">
            Filtrar
          </Button>
        </form>
      </div>

      <div className="flex flex-wrap items-center gap-2 px-4 pb-2.5 md:px-5">
        <div className="flex flex-wrap gap-1">
          {ENTITY_TABS.map((tab) => (
            <button
              key={tab.value || "all"}
              type="button"
              onClick={() => navigate({ entity: tab.value })}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                entityType === tab.value
                  ? "bg-foreground text-background"
                  : "bg-background border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <select
          value={action}
          onChange={(e) => navigate({ action: e.target.value })}
          className="h-7 rounded-md border border-border bg-background px-2 text-[11px] text-foreground"
        >
          {ACTION_OPTIONS.map((opt) => (
            <option key={opt.value || "all-actions"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1.5 ml-auto">
          <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
          {DATE_PRESETS.map((p) => (
            <button
              key={p.days}
              type="button"
              onClick={() => applyPreset(p.days)}
              className="rounded-md border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              {p.label}
            </button>
          ))}
          <input
            ref={fromRef}
            type="date"
            defaultValue={dateFrom}
            className="h-7 rounded-md border border-border bg-background px-1.5 text-[11px]"
          />
          <input
            ref={toRef}
            type="date"
            defaultValue={dateTo}
            className="h-7 rounded-md border border-border bg-background px-1.5 text-[11px]"
          />
          <Button type="button" size="sm" variant="secondary" className="h-7 text-[11px]" onClick={applyDates}>
            Datas
          </Button>
          {hasDateFilter ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 px-1.5"
              onClick={() => navigate({ from: "", to: "" })}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="px-4 pb-2.5 text-xs text-destructive md:px-5">{error}</p>
      ) : null}
    </div>
  )
}
