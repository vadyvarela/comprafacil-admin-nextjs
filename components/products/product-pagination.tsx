"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

type ProductPaginationProps = {
  currentPage: number
  totalPages: number
  totalElements: number
  pageSize: number
}

export function ProductPagination({
  currentPage,
  totalPages,
  totalElements,
  pageSize,
}: ProductPaginationProps) {
  const searchParams = useSearchParams()

  function pageUrl(page: number) {
    const p = new URLSearchParams(searchParams.toString())
    p.set("page", String(page))
    return `?${p.toString()}`
  }

  if (totalPages <= 1 && totalElements <= pageSize) return null

  const hasPrev = currentPage > 0
  const hasNext = currentPage < Math.max(1, totalPages) - 1

  return (
    <div className="flex items-center justify-between gap-2 border-t border-border bg-muted/20 px-3 py-2">
      <span className="text-[11px] text-muted-foreground tabular-nums">
        Página {currentPage + 1} de {Math.max(1, totalPages)}
      </span>
      <div className="flex items-center gap-1">
        {hasPrev ? (
          <Button variant="outline" size="sm" className="h-7 w-7 p-0" asChild>
            <Link href={pageUrl(currentPage - 1)} aria-label="Página anterior">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 w-7 p-0"
            disabled
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
        {hasNext ? (
          <Button variant="outline" size="sm" className="h-7 w-7 p-0" asChild>
            <Link href={pageUrl(currentPage + 1)} aria-label="Página seguinte">
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 w-7 p-0"
            disabled
            aria-label="Página seguinte"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
