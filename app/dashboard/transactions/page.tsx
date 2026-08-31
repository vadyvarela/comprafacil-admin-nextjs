import { Suspense } from "react"
import { getTransactions } from "@/lib/actions"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { TransactionList } from "@/components/transactions/transaction-list"
import { TransactionListToolbar } from "@/components/transactions/transaction-list-toolbar"
import { TransactionPagination } from "@/components/transactions/transaction-pagination"
import { TransactionDetail } from "@/components/transactions/transaction-detail"
import { getValidSession } from "@/lib/auth0"
import { hasMinimumRole } from "@/lib/auth/roles"
import { CreditCard, Search } from "lucide-react"
import { EmptyState } from "@/components/admin/empty-state"

export const dynamic = "force-dynamic"

const PAGE_SIZE = 100

type PageProps = {
  searchParams: Promise<{ page?: string; q?: string; status?: string; from?: string; to?: string; id?: string }>
}

export default async function TransactionsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = Math.max(0, Math.floor(Number(params.page) || 0))
  const search = params.q?.trim() ?? null
  const status = params.status?.trim() || null
  const dateFrom = params.from?.trim() || null
  const dateTo = params.to?.trim() || null
  const detailId = params.id?.trim() || null
  const session = await getValidSession()
  const canDeleteTransactions = hasMinimumRole(session?.user, "admin")

  const result = await getTransactions({
    page: { page, size: PAGE_SIZE, sortBy: "createdAt", sortDirection: "DESC" },
    filter: {
      search,
      status,
      dateFrom: dateFrom ? `${dateFrom}T00:00:00` : null,
      dateTo: dateTo ? `${dateTo}T23:59:59` : null,
    },
  })

  const transactions = result.ok ? result.data.data : []
  const totalElements = result.ok ? result.data.totalElements : 0
  const totalPages = result.ok ? result.data.totalPages : 0
  const error = result.ok ? null : result.error

  // Se há um ?id= na URL, mostramos a página de detalhe com os dados já buscados
  if (detailId) {
    const tx = transactions.find((t) => t.id === detailId) ?? null
    const shortId = detailId.slice(0, 8)
    return (
      <>
        <DashboardHeader
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Transações", href: "/dashboard/transactions" },
            { label: `${shortId}…` },
          ]}
        />
        {tx ? (
          <TransactionDetail
            tx={tx}
            backHref="/dashboard/transactions"
            canDelete={canDeleteTransactions}
          />
        ) : (
          <EmptyState
            icon={CreditCard}
            title="Transação não encontrada"
            description="Esta transação pode estar numa página diferente. Use a busca para localizá-la."
            className="min-h-[400px]"
            tone="warning"
          />
        )}
      </>
    )
  }

  return (
    <>
      <DashboardHeader
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Transações" },
        ]}
      />
      <div className="flex flex-1 flex-col min-h-0">
        <Suspense fallback={null}>
          <TransactionListToolbar
            totalElements={totalElements}
            search={search ?? undefined}
            status={status ?? undefined}
            dateFrom={dateFrom ?? undefined}
            dateTo={dateTo ?? undefined}
            error={error}
          />
        </Suspense>
        <div className="flex-1 overflow-auto p-5 pt-4">
          {result.ok ? (
            <>
              {transactions.length === 0 ? (
                <EmptyState
                  icon={search || status || dateFrom ? Search : CreditCard}
                  title={search || status || dateFrom ? "Nenhum resultado" : "Nenhuma transação"}
                  description={
                    search || status || dateFrom
                      ? "Tente outros filtros ou remova os existentes."
                      : "As transações de pagamento aparecerão aqui."
                  }
                  tone={search || status || dateFrom ? "info" : "neutral"}
                />
              ) : (
                <>
                  <TransactionList
                    transactions={transactions}
                    canDelete={canDeleteTransactions}
                  />
                  <Suspense fallback={null}>
                    <TransactionPagination
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
