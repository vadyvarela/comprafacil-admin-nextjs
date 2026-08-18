import { Suspense } from "react"
import { Package, Plus, Search } from "lucide-react"
import { getProductFilterOptions, getProducts } from "@/lib/actions/products"
import { FILTER_ALL, PRODUCT_PAGE_SIZE } from "@/lib/products/list-filters"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { ProductListToolbar } from "@/components/products/product-list-toolbar"
import { ProductList } from "@/components/products/product-list"
import { Button } from "@/components/ui/button"
import Link from "next/link"

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
          />
        </Suspense>
        <div className="flex-1 overflow-auto p-5">
          {result.ok ? (
            products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-sm mx-auto">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border/80 bg-muted/40 mb-4">
                  {hasActiveFilters ? (
                    <Search className="h-7 w-7 text-muted-foreground/40" />
                  ) : (
                    <Package className="h-7 w-7 text-muted-foreground/40" />
                  )}
                </div>
                <h2 className="text-sm font-semibold text-foreground mb-1">
                  {hasActiveFilters ? "Nenhum resultado" : "Sem produtos"}
                </h2>
                <p className="text-xs text-muted-foreground mb-4">
                  {hasActiveFilters
                    ? "Ajuste a pesquisa ou os filtros de categoria e marca."
                    : "Crie o primeiro produto para começar."}
                </p>
                {!hasActiveFilters && (
                  <Button size="sm" className="gap-1.5" asChild>
                    <Link href="/dashboard/products/new">
                      <Plus className="h-3.5 w-3.5" />
                      Criar produto
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <Suspense fallback={null}>
                <ProductList
                  products={products}
                  currentPage={page}
                  totalPages={totalPages}
                  totalElements={totalElements}
                  pageSize={PRODUCT_PAGE_SIZE}
                />
              </Suspense>
            )
          ) : null}
        </div>
      </div>
    </>
  )
}
