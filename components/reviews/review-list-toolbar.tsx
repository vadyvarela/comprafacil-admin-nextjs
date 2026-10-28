"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { MessageSquareText, Search, Star, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ClearFiltersButton } from "@/components/admin/clear-filters-button"
import { PageToolbar } from "@/components/admin/page-toolbar"
import { LoadError } from "@/components/admin/load-error"
import { cn } from "@/lib/utils"

export type ReviewsTab = "PENDING" | "APPROVED" | "REJECTED" | "ALL"

const TABS: { value: ReviewsTab; label: string; dot?: string }[] = [
  { value: "PENDING", label: "Por moderar", dot: "bg-warning" },
  { value: "APPROVED", label: "Aprovadas", dot: "bg-success" },
  { value: "REJECTED", label: "Rejeitadas", dot: "bg-danger" },
  { value: "ALL", label: "Todas" },
]

type Props = {
  totalElements: number
  currentTab: ReviewsTab
  currentRating: number | null
  error?: string | null
}

export function ReviewListToolbar({ totalElements, currentTab, currentRating, error }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const search = searchParams.get("search") ?? ""

  function urlWith(overrides: Record<string, string | null>) {
    const p = new URLSearchParams(searchParams.toString())
    p.set("page", "0")
    for (const [k, v] of Object.entries(overrides)) {
      if (v === null || v === "") p.delete(k)
      else p.set(k, v)
    }
    return `?${p.toString()}`
  }

  const countLabel = `${totalElements.toLocaleString("pt-PT")} ${totalElements === 1 ? "avaliação" : "avaliações"}`
  const tabLabel = TABS.find((t) => t.value === currentTab)?.label
  const hasActiveFilters = Boolean(search || currentRating || currentTab !== "PENDING")

  return (
    <PageToolbar
      icon={MessageSquareText}
      iconBg="bg-warning-soft"
      iconColor="text-warning-strong"
      title="Avaliações"
      subtitle={
        <>
          <span>{countLabel}</span>
          {currentTab !== "ALL" ? <span>· {tabLabel}</span> : null}
          {currentRating ? <span>· {currentRating} estrelas</span> : null}
        </>
      }
      footer={
        <>
          <div className="flex flex-wrap items-center gap-2">
            <nav aria-label="Filtrar por estado" className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-none">
              {TABS.map(({ value, label, dot }) => {
                const active = currentTab === value
                return (
                  <Link
                    key={value}
                    href={urlWith({ tab: value })}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    )}
                  >
                    {dot && <span className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-white/70" : dot)} />}
                    {label}
                  </Link>
                )
              })}
            </nav>
            <div className="flex items-center gap-1" role="group" aria-label="Filtrar por estrelas">
              {[5, 4, 3, 2, 1].map((n) => {
                const active = currentRating === n
                return (
                  <Link
                    key={n}
                    href={urlWith({ rating: active ? null : String(n) })}
                    aria-pressed={active}
                    className={cn(
                      "flex items-center gap-0.5 rounded-md border px-2 py-1 text-xs font-semibold tabular-nums transition-colors",
                      active
                        ? "border-warning bg-warning-soft text-warning-strong"
                        : "border-border/80 bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {n}
                    <Star className="h-3 w-3 fill-current" aria-hidden />
                  </Link>
                )
              })}
            </div>
          </div>
          {error ? <LoadError title="Erro ao carregar avaliações" message={error} /> : null}
        </>
      }
    >
      <form method="GET" className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto" role="search">
        <input type="hidden" name="page" value="0" />
        <input type="hidden" name="tab" value={currentTab} />
        {currentRating ? <input type="hidden" name="rating" value={currentRating} /> : null}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            name="search"
            placeholder="Produto, cliente, texto…"
            aria-label="Pesquisar avaliações"
            defaultValue={search}
            className="pl-8 h-8 text-xs pr-8"
          />
          {search && (
            <button
              type="button"
              aria-label="Limpar pesquisa"
              title="Limpar pesquisa"
              onClick={() => router.push(urlWith({ search: null }))}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Button type="submit" size="sm" className="h-8 px-3 text-xs sm:w-auto">
          Buscar
        </Button>
        {hasActiveFilters ? <ClearFiltersButton href="/dashboard/reviews" /> : null}
      </form>
    </PageToolbar>
  )
}
