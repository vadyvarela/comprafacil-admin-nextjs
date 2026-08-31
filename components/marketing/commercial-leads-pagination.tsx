"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

type CommercialLeadsPaginationProps = {
  currentPage: number
  totalPages: number
  totalElements: number
  pageSize: number
}

export function CommercialLeadsPagination({
  currentPage,
  totalPages,
  totalElements,
  pageSize,
}: CommercialLeadsPaginationProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const hasPrev = currentPage > 0
  const hasNext = currentPage < Math.max(1, totalPages) - 1
  const start = totalElements === 0 ? 0 : currentPage * pageSize + 1
  const end = Math.min((currentPage + 1) * pageSize, totalElements)

  function pageUrl(page: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", String(page))
    const qs = params.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }

  if (totalPages <= 1 && totalElements <= pageSize) return null

  return (
    <nav
      aria-label="Paginação da lista de leads"
      className="mt-6 flex flex-col items-center justify-between gap-3 border-t pt-4 sm:flex-row"
    >
      <p className="order-2 text-xs text-muted-foreground sm:order-1">
        {totalElements === 0 ? (
          "0 resultados"
        ) : (
          <>
            Mostrando <strong className="text-foreground">{start}</strong>-
            <strong className="text-foreground">{end}</strong> de{" "}
            <strong className="text-foreground">{totalElements}</strong>
          </>
        )}
      </p>
      <div className="order-1 flex items-center gap-2 sm:order-2">
        <Button variant="outline" size="sm" disabled={!hasPrev} asChild>
          <Link href={pageUrl(currentPage - 1)} aria-label="Página anterior">
            <ChevronLeft className="mr-0.5 h-4 w-4" />
            Anterior
          </Link>
        </Button>
        <span className="min-w-[100px] text-center text-xs text-muted-foreground">
          Página {currentPage + 1} de {Math.max(1, totalPages)}
        </span>
        <Button variant="outline" size="sm" disabled={!hasNext} asChild>
          <Link href={pageUrl(currentPage + 1)} aria-label="Próxima página">
            Próxima
            <ChevronRight className="ml-0.5 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </nav>
  )
}
