import { Suspense } from "react"
import { getOrdersPageWithDetails, ORDER_PAGE_SIZE, parseOrdersTab } from "@/lib/actions/orders"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { OrderList } from "@/components/orders/order-list"
import { OrderListToolbar } from "@/components/orders/order-list-toolbar"
import { OrderPagination } from "@/components/orders/order-pagination"
import { OrderListTabs } from "@/components/orders/order-list-tabs"
import { CreditCard, Search } from "lucide-react"
import { EmptyState } from "@/components/admin/empty-state"
import { ReadOnlyNotice } from "@/components/admin/read-only-notice"
import { getValidSession } from "@/lib/auth0"
import { canWriteModule } from "@/lib/auth/roles"

type PageProps = {
  searchParams: Promise<{ search?: string; page?: string; tab?: string; from?: string; to?: string }>
}

function emptyStateConfig(
  search: string | null,
  tab: ReturnType<typeof parseOrdersTab>
): { title: string; description: string; icon: typeof CreditCard } {
  if (search?.trim()) {
    return {
      title: "Nenhum resultado",
      description: "Tente outro termo ou remova o filtro de busca.",
      icon: Search,
    }
  }
  if (tab !== "all") {
    return {
      title: "Nenhum pedido nesta aba",
      description: "Esta aba filtra os pedidos pagos carregados para a página atual.",
      icon: CreditCard,
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
  const dateFrom = params.from ?? null
  const dateTo = params.to ?? null
  const session = await getValidSession()
  const canWriteOrders = canWriteModule(session?.user, "orders")

  const result = await getOrdersPageWithDetails({ search, page, tab, dateFrom, dateTo })

  const orders = result.ok ? result.data.data : []
  const totalElements = result.ok ? (result.data.totalElements ?? 0) : 0
  const totalPages = result.ok ? (result.data.totalPages ?? 0) : 0
  const error = result.ok ? null : result.error
  const pageSize = ORDER_PAGE_SIZE

  const empty = emptyStateConfig(search, tab)

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
            visibleCount={orders.length}
            currentTab={tab}
            error={error}
            dateFrom={dateFrom ?? undefined}
            dateTo={dateTo ?? undefined}
          />
        </Suspense>
        <div className="flex-1 overflow-auto p-5 pt-4 space-y-3">
          {!canWriteOrders ? (
            <ReadOnlyNotice moduleLabel="Pedidos" />
          ) : null}
          {/* Abas de status (Todos, Pago, Pendentes) */}
          <OrderListTabs currentTab={tab} />
          {result.ok ? (
            <>
              {orders.length === 0 ? (
                <EmptyState
                  icon={empty.icon}
                  title={empty.title}
                  description={empty.description}
                  tone={search ? "info" : "neutral"}
                  className="py-20"
                />
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
