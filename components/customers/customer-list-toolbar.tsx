"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Search, Users } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type CustomerListToolbarProps = {
  totalElements: number
  error?: string | null
}

export function CustomerListToolbar({ totalElements, error }: CustomerListToolbarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const search = searchParams.get("search") ?? ""

  return (
    <div className="border-b border-border bg-muted/30 sticky top-12 z-30">
      <div className="px-4 py-2.5 md:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border/60 bg-violet-50">
              <Users className="h-4 w-4 text-violet-700" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-foreground">Clientes</h1>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {totalElements} cliente{totalElements !== 1 ? "s" : ""} registado{totalElements !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <form method="GET" className="flex gap-2" role="search" aria-label="Buscar clientes">
            <input type="hidden" name="page" value="0" />
            <div className="relative w-56 sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                name="search"
                placeholder="Nome, email, telefone…"
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
          <div className="mt-3 p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-xs">
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
