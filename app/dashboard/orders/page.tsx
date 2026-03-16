import { Suspense } from "react"
import { getOrdersPageWithDetails, ORDER_PAGE_SIZE, parseOrdersTab } from "@/lib/actions/orders"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { OrderList } from "@/components/orders/order-list"
import { OrderListToolbar } from "@/components/orders/order-list-toolbar"
import { OrderPagination } from "@/components/orders/order-pagination"
import { OrderListTabs } from "@/components/orders/order-list-tabs"
import { CreditCard, Search } from "lucide-react"

type PageProps = {
  searchParams: Promise<{ search?: string; page?: string; tab?: string }>
}

function emptyStateConfig(
  search: string | null
): { title: string; description: string; icon: typeof CreditCard } {
  if (search?.trim()) {
    return {
      title: "Nenhum resultado",
      description: "Tente outro termo ou remova o filtro de busca.",
      icon: Search,
    }
  }
  return {
    title: "Nenhum pedido pago",
    description: "Pedidos com pagamento efetuado aparecerão aqui.",
    icon: CreditCard,
  }
}

export default async function OrdersPage({ searchParams }: PageProps) {
  const params = await searchParams
  const search = params.search?.trim() ?? null
  const page = Math.max(0, Math.floor(Number(params.page) || 0))
  const tab = parseOrdersTab(params.tab ?? null)

  const result = await getOrdersPageWithDetails({ search, page, tab })

  const orders = result.ok ? result.data.data : []
  const totalElements = result.ok ? (result.data.totalElements ?? 0) : 0
  const totalPages = result.ok ? (result.data.totalPages ?? 0) : 0
  const error = result.ok ? null : result.error
  const pageSize = ORDER_PAGE_SIZE

  const empty = emptyStateConfig(search)

  return (
    <>
      <DashboardHeader
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Pedidos" },
        ]}
      />
      <div className="flex flex-1 flex-col min-h-0">
        <Suspense fallback={null}>
          <OrderListToolbar
            totalElements={totalElements}
            error={error}
          />
        </Suspense>
        <div className="flex-1 overflow-auto p-4 pt-3 space-y-3">
          {/* Abas de status (Todos, Pago, Pendentes) */}
          <OrderListTabs currentTab={tab} />
          {result.ok ? (
            <>
              {orders.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-sm mx-auto"
                  role="status"
                  aria-label={empty.title}
                >
                  <empty.icon className="h-10 w-10 text-muted-foreground mb-4" />
                  <h2 className="text-sm font-semibold text-foreground mb-1">
                    {empty.title}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {empty.description}
                  </p>
                </div>
              ) : (
                <>
                  <OrderList orders={orders} />
                  <Suspense fallback={null}>
                    <OrderPagination
                      currentPage={page}
                      totalPages={totalPages}
                      totalElements={totalElements}
                      pageSize={pageSize}
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
