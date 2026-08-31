import { Suspense } from "react"
import { AlarmClock, PhoneCall, Search } from "lucide-react"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { EmptyState } from "@/components/admin/empty-state"
import { CommercialLeadMetrics } from "@/components/marketing/commercial-lead-metrics"
import { CommercialLeadsList } from "@/components/marketing/commercial-leads-list"
import { CommercialLeadsPagination } from "@/components/marketing/commercial-leads-pagination"
import { CommercialLeadsToolbar } from "@/components/marketing/commercial-leads-toolbar"
import { getCommercialRecoveryLeads } from "@/lib/actions/commercial-leads"
import type {
  CommercialLeadFollowUpStatus,
  CommercialRecoveryLeadMetrics,
} from "@/lib/graphql/commercial-leads/types"

export const dynamic = "force-dynamic"

const PAGE_SIZE = 50

const VALID_STATUSES = new Set<CommercialLeadFollowUpStatus>([
  "NEW",
  "CONTACTED",
  "NO_ANSWER",
  "CONVERTED",
  "LOST",
])

const EMPTY_METRICS: CommercialRecoveryLeadMetrics = {
  totalActive: 0,
  newCount: 0,
  contactedCount: 0,
  noAnswerCount: 0,
  overdueCount: 0,
  potentialAmount: 0,
  currency: "CVE",
}

type PageProps = {
  searchParams: Promise<{
    page?: string
    q?: string
    status?: string
    from?: string
    to?: string
    due?: string
  }>
}

export default async function CommercialLeadsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = Math.max(0, Math.floor(Number(params.page) || 0))
  const search = params.q?.trim() || null
  const status = parseStatus(params.status)
  const dateFrom = params.from?.trim() || null
  const dateTo = params.to?.trim() || null
  const dueOnly = params.due === "1" || params.due === "true"

  const result = await getCommercialRecoveryLeads({
    page: {
      page,
      size: PAGE_SIZE,
      sortBy: "lastAttemptAt",
      sortDirection: "DESC",
    },
    filter: {
      search,
      followUpStatus: status,
      dateFrom: dateFrom ? `${dateFrom}T00:00:00` : null,
      dateTo: dateTo ? `${dateTo}T23:59:59` : null,
      dueOnly,
    },
  })

  const leads = result.ok ? result.data.data : []
  const metrics = result.ok ? result.data.metrics : EMPTY_METRICS
  const totalElements = result.ok ? result.data.totalElements : 0
  const totalPages = result.ok ? result.data.totalPages : 0
  const error = result.ok ? null : result.error
  const hasFilters = Boolean(search || status || dateFrom || dateTo || dueOnly)

  return (
    <>
      <DashboardHeader
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Marketing" },
          { label: "Leads" },
        ]}
      />
      <div className="flex min-h-0 flex-1 flex-col">
        <Suspense fallback={null}>
          <CommercialLeadsToolbar
            totalElements={totalElements}
            search={search ?? undefined}
            status={status ?? undefined}
            dateFrom={dateFrom ?? undefined}
            dateTo={dateTo ?? undefined}
            dueOnly={dueOnly}
            error={error}
          />
        </Suspense>
        <div className="flex-1 overflow-auto p-5 pt-4">
          <div className="mb-4">
            <CommercialLeadMetrics metrics={metrics} />
          </div>

          {result.ok ? (
            <>
              {leads.length === 0 ? (
                <EmptyState
                  icon={dueOnly ? AlarmClock : hasFilters ? Search : PhoneCall}
                  title={hasFilters ? "Nenhum resultado" : "Nenhum lead para recuperar"}
                  description={
                    hasFilters
                      ? "Tente outros filtros ou remova os existentes."
                      : "Clientes com tentativa de pagamento sem captura aparecerão aqui."
                  }
                  tone={hasFilters ? "info" : "neutral"}
                />
              ) : (
                <>
                  <CommercialLeadsList leads={leads} />
                  <Suspense fallback={null}>
                    <CommercialLeadsPagination
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

function parseStatus(value: string | null | undefined) {
  const normalized = value?.trim().toUpperCase()
  if (!normalized) return null
  return VALID_STATUSES.has(normalized as CommercialLeadFollowUpStatus)
    ? (normalized as CommercialLeadFollowUpStatus)
    : null
}
