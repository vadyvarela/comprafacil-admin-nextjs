import { Suspense } from "react"
import { getTransactions } from "@/lib/actions"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { TransactionList } from "@/components/transactions/transaction-list"
import { TransactionListToolbar } from "@/components/transactions/transaction-list-toolbar"
import { TransactionPagination } from "@/components/transactions/transaction-pagination"
import { TransactionDetail } from "@/components/transactions/transaction-detail"
import { CreditCard } from "lucide-react"

const PAGE_SIZE = 20

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
          <TransactionDetail tx={tx} backHref="/dashboard/transactions" />
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
            <div className="text-center space-y-3 max-w-md">
              <CreditCard className="h-10 w-10 mx-auto text-muted-foreground" />
              <h2 className="text-lg font-semibold">Transação não encontrada</h2>
              <p className="text-sm text-muted-foreground">
                Esta transação pode estar numa página diferente. Use a busca para localizá-la.
              </p>
            </div>
          </div>
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
        <div className="flex-1 overflow-auto p-4 pt-3">
          {result.ok ? (
            <>
              {transactions.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-sm mx-auto"
                  role="status"
                  aria-label="Nenhuma transação"
                >
                  <CreditCard className="h-10 w-10 text-muted-foreground mb-4" />
                  <h2 className="text-sm font-semibold text-foreground mb-1">
                    {search || status || dateFrom ? "Nenhum resultado" : "Nenhuma transação"}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {search || status || dateFrom
                      ? "Tente outros filtros ou remova os existentes."
                      : "As transações de pagamento aparecerão aqui."}
                  </p>
                </div>
              ) : (
                <>
                  <TransactionList transactions={transactions} />
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
