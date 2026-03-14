"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type OrderListToolbarProps = {
  totalElements: number
  error?: string | null
}

export function OrderListToolbar({
  totalElements,
  error,
}: OrderListToolbarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const search = searchParams.get("search") ?? ""

  return (
    <div className="border-b border-border bg-card">
      <div className="px-4 py-2.5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-base font-semibold tracking-tight">Pedidos</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {totalElements} pedido{totalElements !== 1 ? "s" : ""} com pagamento efetuado
            </p>
          </div>
          <form
            method="GET"
            className="flex gap-2"
            role="search"
            aria-label="Buscar pedidos"
          >
            <input type="hidden" name="page" value="0" />
            <div className="relative w-56 sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" aria-hidden />
              <Input
                name="search"
                placeholder="Referência, cliente…"
                defaultValue={search}
                className="pl-8 h-8 text-xs"
                aria-label="Texto da busca"
              />
            </div>
            <Button type="submit" size="sm" className="h-8 text-xs">
              Buscar
            </Button>
          </form>
        </div>
      {error && (
        <div className="mt-2.5 p-2.5 rounded-md border border-destructive/50 bg-destructive/10 text-xs">
          <p className="font-medium text-destructive mb-1">Erro ao carregar</p>
          <p className="text-muted-foreground text-xs mb-2">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.refresh()}
          >
            Tentar novamente
          </Button>
        </div>
      )}
      </div>
    </div>
  )
}
