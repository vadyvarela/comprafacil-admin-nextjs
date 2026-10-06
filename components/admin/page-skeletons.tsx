import { DashboardHeader, type BreadcrumbItemType } from "@/components/layout/dashboard-header"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * Esqueletos para os `loading.tsx`: mesma forma que a página real (cabeçalho,
 * toolbar, conteúdo), para a página não saltar quando os dados chegam.
 */

function ToolbarSkeleton({ filterRows = 0 }: { filterRows?: number }) {
  return (
    <div className="sticky top-12 z-30 border-b border-border/80 bg-background px-4 py-3 md:px-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-8 w-8" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
        <Skeleton className="h-8 w-full sm:w-72" />
      </div>
      {Array.from({ length: filterRows }, (_, i) => (
        <div key={i} className="mt-3 flex gap-2">
          {Array.from({ length: 4 }, (_, j) => (
            <Skeleton key={j} className="h-7 w-20" />
          ))}
        </div>
      ))}
    </div>
  )
}

function TableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border/80 bg-card">
      <div className="flex gap-4 border-b border-border/70 bg-muted/35 px-4 py-3">
        {[120, 160, 100, 90].map((w) => (
          <Skeleton key={w} className="h-3.5" style={{ width: w }} />
        ))}
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-border/60 px-4 py-3 last:border-b-0">
          <Skeleton className="h-9 w-9 shrink-0" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-full max-w-[220px]" />
            <Skeleton className="h-3 w-full max-w-[140px]" />
          </div>
          <Skeleton className="hidden h-5 w-20 rounded-full sm:block" />
          <Skeleton className="h-3.5 w-16" />
        </div>
      ))}
    </div>
  )
}

export function ListPageSkeleton({
  breadcrumb,
  filterRows = 0,
}: {
  breadcrumb: BreadcrumbItemType[]
  /** Linhas de filtros por baixo do título (abas, datas). */
  filterRows?: number
}) {
  return (
    <>
      <DashboardHeader items={breadcrumb} />
      <div className="flex min-h-0 flex-1 flex-col" aria-busy="true" aria-label="A carregar">
        <ToolbarSkeleton filterRows={filterRows} />
        <div className="flex-1 p-5">
          <TableSkeleton />
        </div>
      </div>
    </>
  )
}

export function OverviewPageSkeleton({ breadcrumb }: { breadcrumb: BreadcrumbItemType[] }) {
  return (
    <>
      <DashboardHeader items={breadcrumb} />
      <div className="flex flex-1 flex-col gap-5 p-4 md:p-5" aria-busy="true" aria-label="A carregar">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-[92px] rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-lg" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    </>
  )
}
