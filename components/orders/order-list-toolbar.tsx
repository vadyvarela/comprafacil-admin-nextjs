"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Search, ShoppingCart, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type OrderListToolbarProps = {
  totalElements: number
  error?: string | null
}

export function OrderListToolbar({ totalElements, error }: OrderListToolbarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const search = searchParams.get("search") ?? ""

  return (
    <div className="border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="px-5 py-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Title */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-sm shadow-indigo-500/30">
              <ShoppingCart className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-foreground">Pedidos</h1>
              <p className="text-xs text-muted-foreground">
                {totalElements.toLocaleString("pt-PT")} pedido{totalElements !== 1 ? "s" : ""} com pagamento efetuado
              </p>
            </div>
          </div>

          {/* Search */}
          <form method="GET" className="flex gap-2" role="search">
            <input type="hidden" name="page" value="0" />
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

        {error && (
          <div className="mt-3 p-3 rounded-xl border border-destructive/30 bg-destructive/5 text-xs flex items-start gap-2">
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
    </div>
  )
}
