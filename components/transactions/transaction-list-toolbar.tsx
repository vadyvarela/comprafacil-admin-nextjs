"use client"

import { useRouter } from "next/navigation"
import { Search, CreditCard } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type TransactionListToolbarProps = {
  totalElements: number
  search?: string
  error?: string | null
}

export function TransactionListToolbar({
  totalElements,
  search = "",
  error,
}: TransactionListToolbarProps) {
  const router = useRouter()

  return (
    <div className="border-b border-border bg-card/60 backdrop-blur">
      <div className="px-5 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <CreditCard className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-foreground">Transações</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {totalElements} transaç{totalElements !== 1 ? "ões" : "ão"} registadas
              </p>
            </div>
          </div>
          <form method="GET" className="flex gap-2" role="search" aria-label="Buscar transações">
            <input type="hidden" name="page" value="0" />
            <div className="relative w-56 sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                name="q"
                placeholder="Ref., cliente…"
                defaultValue={search}
                className="pl-8 h-8 text-xs"
              />
            </div>
            <Button type="submit" size="sm" className="h-8 text-xs">
              Buscar
            </Button>
          </form>
        </div>
        {error && (
          <div className="mt-3 p-3 rounded-xl border border-destructive/40 bg-destructive/5 text-xs">
            <p className="font-semibold text-destructive mb-1">Erro ao carregar</p>
            <p className="text-muted-foreground mb-2">{error}</p>
            <Button variant="outline" size="sm" onClick={() => router.refresh()}>
              Tentar novamente
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
