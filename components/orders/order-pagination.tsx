"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

type OrderPaginationProps = {
  currentPage: number
  totalPages: number
  totalElements: number
  pageSize: number
}

export function OrderPagination({
  currentPage,
  totalPages,
  totalElements,
  pageSize,
}: OrderPaginationProps) {
  const searchParams = useSearchParams()
  const hasPrev = currentPage > 0
  const hasNext = currentPage < Math.max(1, totalPages) - 1

  const start = totalElements === 0 ? 0 : currentPage * pageSize + 1
  const end = Math.min((currentPage + 1) * pageSize, totalElements)

  function pageUrl(page: number) {
    const p = new URLSearchParams(searchParams.toString())
    p.set("page", String(page))
    return `?${p.toString()}`
  }

  if (totalPages <= 1 && totalElements <= pageSize) return null

  return (
    <nav
      aria-label="Paginação da lista de pedidos"
      className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 pt-4 border-t"
    >
      <p className="text-xs text-muted-foreground order-2 sm:order-1">
        {totalElements === 0 ? (
          "0 resultados"
        ) : (
          <>
            Mostrando <strong className="text-foreground">{start}</strong>–<strong className="text-foreground">{end}</strong> de{" "}
            <strong className="text-foreground">{totalElements}</strong>
          </>
        )}
      </p>
      <div className="flex items-center gap-2 order-1 sm:order-2">
        <Button variant="outline" size="sm" disabled={!hasPrev} asChild>
          <Link
            href={pageUrl(currentPage - 1)}
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-4 w-4 mr-0.5" />
            Anterior
          </Link>
        </Button>
        <span className="text-xs text-muted-foreground min-w-[100px] text-center">
          Página {currentPage + 1} de {Math.max(1, totalPages)}
        </span>
        <Button variant="outline" size="sm" disabled={!hasNext} asChild>
          <Link
            href={pageUrl(currentPage + 1)}
            aria-label="Próxima página"
          >
            Próxima
            <ChevronRight className="h-4 w-4 ml-0.5" />
          </Link>
        </Button>
      </div>
    </nav>
  )
}
