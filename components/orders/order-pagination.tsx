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
    <div className="flex items-center justify-between gap-3 py-3 px-1">
      <p className="text-xs text-muted-foreground">
        {totalElements === 0 ? "0 resultados" : (
          <>
            <span className="font-semibold text-foreground">{start}–{end}</span>
            {" "}de{" "}
            <span className="font-semibold text-foreground">{totalElements.toLocaleString("pt-PT")}</span>
          </>
        )}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1 text-xs"
          disabled={!hasPrev}
          asChild={hasPrev}
        >
          {hasPrev ? (
            <Link href={pageUrl(currentPage - 1)}>
              <ChevronLeft className="h-3.5 w-3.5" />
              Anterior
            </Link>
          ) : (
            <span>
              <ChevronLeft className="h-3.5 w-3.5" />
              Anterior
            </span>
          )}
        </Button>
        <span className="text-xs font-medium text-muted-foreground px-2">
          {currentPage + 1} / {Math.max(1, totalPages)}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1 text-xs"
          disabled={!hasNext}
          asChild={hasNext}
        >
          {hasNext ? (
            <Link href={pageUrl(currentPage + 1)}>
              Próxima
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <span>
              Próxima
              <ChevronRight className="h-3.5 w-3.5" />
            </span>
          )}
        </Button>
      </div>
    </div>
  )
}
