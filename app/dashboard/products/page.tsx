import { Suspense } from "react"
import { Package, Plus, Search } from "lucide-react"
import { getProductFilterOptions, getProducts } from "@/lib/actions/products"
import { FILTER_ALL, PRODUCT_PAGE_SIZE } from "@/lib/products/list-filters"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { ProductListToolbar } from "@/components/products/product-list-toolbar"
import { ProductList } from "@/components/products/product-list"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/admin/empty-state"
import Link from "next/link"
import { getValidSession } from "@/lib/auth0"
import { canWriteModule } from "@/lib/auth/roles"

export const dynamic = "force-dynamic"

type PageProps = {
  searchParams: Promise<{
    search?: string
    page?: string
    category?: string
    brand?: string
    status?: string
  }>
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const search = params.search?.trim() ?? null
  const page = Math.max(0, Math.floor(Number(params.page) || 0))
  const category = params.category?.trim() || FILTER_ALL
  const brand = params.brand?.trim() || FILTER_ALL
  const status = params.status?.trim() || FILTER_ALL
  const session = await getValidSession()
  const canWriteProducts = canWriteModule(session?.user, "products")

  const [result, options] = await Promise.all([
    getProducts({ search, page, category, brand, status }),
    getProductFilterOptions(),
  ])

  const products = result.ok ? result.data.data : []
  const totalElements = result.ok ? (result.data.totalElements ?? 0) : 0
  const totalPages = result.ok ? (result.data.totalPages ?? 0) : 0
  const error = result.ok ? null : result.error

  const hasActiveFilters =
    Boolean(search) ||
    category !== FILTER_ALL ||
    brand !== FILTER_ALL ||
    status !== FILTER_ALL

  return (
    <>
      <DashboardHeader items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Produtos" }]} />
      <div className="flex flex-1 flex-col min-h-0">
        <Suspense fallback={null}>
          <ProductListToolbar
            totalElements={totalElements}
            error={error}
            hasActiveFilters={hasActiveFilters}
            categories={options.categories}
            brands={options.brands}
            canWrite={canWriteProducts}
          />
        </Suspense>
        <div className="flex-1 overflow-auto p-5">
          {result.ok ? (
            products.length === 0 ? (
              <EmptyState
                icon={hasActiveFilters ? Search : Package}
                title={hasActiveFilters ? "Nenhum resultado" : "Sem produtos"}
                description={
                  hasActiveFilters
                    ? "Ajuste a pesquisa ou os filtros de categoria e marca."
                    : canWriteProducts
                      ? "Crie o primeiro produto para começar."
                      : "Ainda não existem produtos registados no catálogo."
                }
                action={
                  !hasActiveFilters && canWriteProducts ? (
                  <Button size="sm" className="gap-1.5" asChild>
                    <Link href="/dashboard/products?create=1">
                      <Plus className="h-3.5 w-3.5" />
                      Criar produto
                    </Link>
                  </Button>
                  ) : null
                }
                tone={hasActiveFilters ? "info" : "neutral"}
              />
            ) : (
              <Suspense fallback={null}>
                <ProductList
                  products={products}
                  currentPage={page}
                  totalPages={totalPages}
                  totalElements={totalElements}
                  pageSize={PRODUCT_PAGE_SIZE}
                  canWrite={canWriteProducts}
                />
              </Suspense>
            )
          ) : null}
        </div>
      </div>
    </>
  )
}
