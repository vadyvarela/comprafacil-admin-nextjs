"use client"

import { PageToolbar } from "@/components/admin/page-toolbar"
import { LoadError } from "@/components/admin/load-error"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Search, ScrollText, X, CalendarDays } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ClearFiltersButton } from "@/components/admin/clear-filters-button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  { label: "Produto actualizado", value: "PRODUCT_UPDATED" },
  { label: "Cupão criado", value: "COUPON_CREATED" },
  { label: "Cupão actualizado", value: "COUPON_UPDATED" },
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
  const hasActiveFilters = Boolean(search || entityType || action || dateFrom || dateTo)

  return (
    <PageToolbar
      icon={ScrollText}
      iconBg="bg-muted"
      iconColor="text-muted-foreground"
      title="Logs"
      subtitle={
        <>
          {totalElements} evento{totalElements !== 1 ? "s" : ""}
        </>
      }
      footer={
        <>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-1">
              {ENTITY_TABS.map((tab) => (
                <button
                  key={tab.value || "all"}
                  type="button"
                  aria-pressed={entityType === tab.value}
                  onClick={() => navigate({ entity: tab.value })}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    entityType === tab.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border/80 text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <Select
              value={action || "__all__"}
              onValueChange={(value) => navigate({ action: value === "__all__" ? "" : value })}
            >
              <SelectTrigger className="h-7 w-full text-xs sm:w-[190px]" aria-label="Filtrar por ação">
                <SelectValue placeholder="Ação" />
              </SelectTrigger>
              <SelectContent>
                {ACTION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value || "all-actions"} value={opt.value || "__all__"}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex flex-wrap items-center gap-1.5 lg:ml-auto">
              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
              {DATE_PRESETS.map((p) => (
                <button
                  key={p.days}
                  type="button"
                  onClick={() => applyPreset(p.days)}
                  className="rounded-md border border-border/80 bg-card px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                >
                  {p.label}
                </button>
              ))}
              <input
                ref={fromRef}
                type="date"
                defaultValue={dateFrom}
                className="h-7 rounded-md border border-border/80 bg-background px-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring/35"
              />
              <input
                ref={toRef}
                type="date"
                defaultValue={dateTo}
                className="h-7 rounded-md border border-border/80 bg-background px-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring/35"
              />
              <Button type="button" size="sm" variant="secondary" className="h-7 text-xs" onClick={applyDates}>
                Datas
              </Button>
              {hasDateFilter ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 px-1.5"
                  onClick={() => navigate({ from: "", to: "" })}
                  aria-label="Limpar datas"
                  title="Limpar datas"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              ) : null}
            </div>
          </div>
          {error ? <LoadError title="Erro ao carregar logs" message={error} /> : null}
        </>
      }
    >
      <form method="GET" action={pathname} className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto" role="search">
        <input type="hidden" name="page" value="0" />
        {entityType ? <input type="hidden" name="entity" value={entityType} /> : null}
        {action ? <input type="hidden" name="action" value={action} /> : null}
        {dateFrom ? <input type="hidden" name="from" value={dateFrom} /> : null}
        {dateTo ? <input type="hidden" name="to" value={dateTo} /> : null}
        <div className="relative w-full sm:w-56">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={search}
            placeholder="Pesquisar…"
            className="h-8 w-full pl-8 text-xs"
          />
        </div>
        <Button type="submit" size="sm" variant="secondary" className="h-8 text-xs">
          Filtrar
        </Button>
        {hasActiveFilters ? <ClearFiltersButton href={pathname} /> : null}
      </form>
    </PageToolbar>
  )
}
