import { Suspense } from "react"
import { getAuditLogs } from "@/lib/actions/auditLogs"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { AuditLogList } from "@/components/logs/audit-log-list"
import { AuditLogToolbar } from "@/components/logs/audit-log-toolbar"
import { AuditLogPagination } from "@/components/logs/audit-log-pagination"
import { ScrollText } from "lucide-react"

export const dynamic = "force-dynamic"

const PAGE_SIZE = 50

type PageProps = {
  searchParams: Promise<{
    page?: string
    q?: string
    entity?: string
    action?: string
    from?: string
    to?: string
  }>
}

export default async function LogsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = Math.max(0, Math.floor(Number(params.page) || 0))
  const search = params.q?.trim() ?? null
  const entityType = params.entity?.trim() || null
  const action = params.action?.trim() || null
  const dateFrom = params.from?.trim() || null
  const dateTo = params.to?.trim() || null

  const result = await getAuditLogs({
    page: { page, size: PAGE_SIZE, sortBy: "createdAt", sortDirection: "DESC" },
    filter: {
      search,
      entityType,
      action,
      dateFrom: dateFrom ? `${dateFrom}T00:00:00` : null,
      dateTo: dateTo ? `${dateTo}T23:59:59` : null,
    },
  })

  const logs = result.ok ? result.data.data : []
  const totalElements = result.ok ? result.data.totalElements : 0
  const totalPages = result.ok ? result.data.totalPages : 0
  const error = result.ok ? null : result.error

  return (
    <>
      <DashboardHeader
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Logs" },
        ]}
      />
      <div className="flex flex-1 flex-col min-h-0">
        <Suspense fallback={null}>
          <AuditLogToolbar
            totalElements={totalElements}
            search={search ?? undefined}
            entityType={entityType ?? undefined}
            action={action ?? undefined}
            dateFrom={dateFrom ?? undefined}
            dateTo={dateTo ?? undefined}
            error={error}
          />
        </Suspense>
        <div className="flex-1 overflow-auto p-5 pt-4">
          {result.ok ? (
            <>
              {logs.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-sm mx-auto"
                  role="status"
                  aria-label="Nenhum log"
                >
                  <ScrollText className="h-10 w-10 text-muted-foreground mb-4" />
                  <h2 className="text-sm font-semibold text-foreground mb-1">
                    {search || entityType || action || dateFrom
                      ? "Nenhum resultado"
                      : "Nenhum evento"}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {search || entityType || action || dateFrom
                      ? "Tente outros filtros ou remova os existentes."
                      : "As ações do backoffice aparecerão aqui."}
                  </p>
                </div>
              ) : (
                <>
                  <AuditLogList logs={logs} />
                  <Suspense fallback={null}>
                    <AuditLogPagination
                      currentPage={page}
                      totalPages={totalPages}
                      totalElements={totalElements}
                      pageSize={PAGE_SIZE}
                    />
                  </Suspense>
                </>
              )}
            </>
          ) : null}
        </div>
      </div>
    </>
  )
}
