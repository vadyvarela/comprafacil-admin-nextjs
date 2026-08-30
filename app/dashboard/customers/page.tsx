import { Suspense } from "react"
import { Users, Search } from "lucide-react"
import { getCustomers, CUSTOMER_PAGE_SIZE } from "@/lib/actions/customers"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { CustomerList } from "@/components/customers/customer-list"
import { CustomerListToolbar } from "@/components/customers/customer-list-toolbar"
import { CustomerPagination } from "@/components/customers/customer-pagination"
import { EmptyState } from "@/components/admin/empty-state"

type PageProps = {
  searchParams: Promise<{ search?: string; page?: string }>
}

function emptyStateConfig(
  search: string | null
): { title: string; description: string; icon: typeof Users } {
  if (search?.trim()) {
    return {
      title: "Nenhum resultado",
      description: "Tente outro termo ou remova o filtro de busca.",
      icon: Search,
    }
  }
  return {
    title: "Nenhum cliente registado",
    description: "Os clientes aparecerão aqui quando houver pedidos ou registos.",
    icon: Users,
  }
}

export default async function CustomersPage({ searchParams }: PageProps) {
  const params = await searchParams
  const search = params.search?.trim() ?? null
  const page = Math.max(0, Math.floor(Number(params.page) || 0))

  const result = await getCustomers({ search, page })

  const customers = result.ok ? result.data.data : []
  const totalElements = result.ok ? (result.data.totalElements ?? 0) : 0
  const totalPages = result.ok ? (result.data.totalPages ?? 0) : 0
  const error = result.ok ? null : result.error
  const pageSize = CUSTOMER_PAGE_SIZE

  const empty = emptyStateConfig(search)

  return (
    <>
      <DashboardHeader
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Clientes" },
        ]}
      />
      <div className="flex flex-1 flex-col min-h-0">
        <Suspense fallback={null}>
          <CustomerListToolbar totalElements={totalElements} error={error} />
        </Suspense>
        <div className="flex-1 overflow-auto p-5 pt-4">
          {result.ok ? (
            <>
              {customers.length === 0 ? (
                <EmptyState
                  icon={empty.icon}
                  title={empty.title}
                  description={empty.description}
                  tone={search ? "info" : "neutral"}
                />
              ) : (
                <>
                  <CustomerList customers={customers} />
                  <Suspense fallback={null}>
                    <CustomerPagination
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
