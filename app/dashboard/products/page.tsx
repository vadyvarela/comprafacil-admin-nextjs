"use client"

import { useEffect, useMemo, useState } from "react"
import { NetworkStatus } from "@apollo/client"
import { useQuery, useMutation } from "@apollo/client/react"
import { GET_PRODUCTS } from "@/lib/graphql/products/queries"
import { GET_CATEGORY_LIST } from "@/lib/graphql/categories/queries"
import { GET_BRAND_LIST } from "@/lib/graphql/brands/queries"
import { DELETE_PRODUCT } from "@/lib/graphql/products/mutations"
import type { Product, ProductFilterInput } from "@/lib/graphql/products/types"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { PageToolbar } from "@/components/admin/page-toolbar"
import { CreateProductModal } from "@/components/products/create-product-modal"
import Link from "next/link"
import Image from "next/image"
import {
  Package,
  Plus,
  Search,
  Tag,
  MoreVertical,
  Trash2,
  Loader2,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { showToast } from "@/lib/utils/toast"

const FILTER_ALL = "all"
const FILTER_NONE = "__none__"
const PAGE_SIZE = 20

function buildProductListFilter(
  debouncedSearch: string,
  filterCategoryId: string,
  filterBrandId: string
): ProductFilterInput | null {
  const f: ProductFilterInput = {}
  if (debouncedSearch) f.search = debouncedSearch
  if (filterCategoryId === FILTER_NONE) f.withoutCategory = true
  else if (filterCategoryId !== FILTER_ALL) f.categoryId = filterCategoryId
  if (filterBrandId === FILTER_NONE) f.withoutBrand = true
  else if (filterBrandId !== FILTER_ALL) f.brandId = filterBrandId
  if (
    !f.search &&
    f.categoryId == null &&
    f.brandId == null &&
    !f.withoutCategory &&
    !f.withoutBrand
  ) {
    return null
  }
  return f
}

export default function ProductsPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [filterBrandId, setFilterBrandId] = useState(FILTER_ALL)
  const [filterCategoryId, setFilterCategoryId] = useState(FILTER_ALL)
  const [pageIndex, setPageIndex] = useState(0)
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 350)
    return () => clearTimeout(t)
  }, [searchQuery])

  useEffect(() => {
    setPageIndex(0)
  }, [debouncedSearch, filterCategoryId, filterBrandId])

  const filter = useMemo(
    () => buildProductListFilter(debouncedSearch, filterCategoryId, filterBrandId),
    [debouncedSearch, filterCategoryId, filterBrandId]
  )

  const { data: categoriesListData } = useQuery<{
    categoryList: { id: string; name: string }[]
  }>(GET_CATEGORY_LIST)

  const { data: brandsListData } = useQuery<{
    brandList: { id: string; name: string }[]
  }>(GET_BRAND_LIST)

  const { data, loading, error, refetch, networkStatus } = useQuery<{
    products: {
      data: Product[]
      pageNumber: number
      pageSize: number
      totalElements: number
      totalPages: number
    }
  }>(GET_PRODUCTS, {
    variables: {
      filter,
      page: {
        page: pageIndex,
        size: PAGE_SIZE,
        sortBy: "createdAt",
        sortDirection: "DESC",
      },
    },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "cache-and-network",
  })

  const [deleteProduct] = useMutation(DELETE_PRODUCT)

  const handleDeleteProduct = async (productId: string, productTitle: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (
      !confirm(
        `Tem certeza que deseja excluir o produto "${productTitle}"?\n\nEsta ação irá excluir o produto e todas as suas variantes. Esta ação não pode ser desfeita.`
      )
    ) {
      return
    }

    setDeletingProductId(productId)
    try {
      await deleteProduct({ variables: { id: productId } })
      await refetch()
      showToast.success("Produto excluído", `O produto "${productTitle}" foi excluído com sucesso`)
    } catch (err: any) {
      console.error("Error deleting product:", err)
      const errorMessage = err?.message || "Erro ao excluir produto. Tente novamente."
      showToast.error("Erro ao excluir produto", errorMessage)
    } finally {
      setDeletingProductId(null)
    }
  }

  const productsList = data?.products.data ?? []
  const total = data?.products.totalElements ?? 0
  const totalPages = data?.products.totalPages ?? 0
  const isRefreshing = networkStatus === NetworkStatus.refetch
  const showInitialSkeleton = loading && !data?.products
  const hasActiveFilters =
    debouncedSearch.length > 0 ||
    filterBrandId !== FILTER_ALL ||
    filterCategoryId !== FILTER_ALL

  const categoryFilterOptions = [...(categoriesListData?.categoryList ?? [])].sort((a, b) =>
    a.name.localeCompare(b.name, "pt")
  )
  const brandFilterOptions = [...(brandsListData?.brandList ?? [])].sort((a, b) =>
    a.name.localeCompare(b.name, "pt")
  )

  return (
    <>
      <DashboardHeader items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Produtos" }]} />
      <div className="flex flex-1 flex-col min-h-0">
        <PageToolbar
          icon={Package}
          iconBg="bg-indigo-500/10"
          iconColor="text-indigo-400"
          title="Produtos"
          subtitle={
            showInitialSkeleton
              ? "A carregar…"
              : hasActiveFilters
                ? `${total} produto${total !== 1 ? "s" : ""} encontrado${total !== 1 ? "s" : ""}`
                : `${total} produto${total !== 1 ? "s" : ""} no catálogo`
          }
        >
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-44 sm:w-52">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Título, descrição, SKU…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
            <Select value={filterCategoryId} onValueChange={setFilterCategoryId}>
              <SelectTrigger className="h-8 w-[140px] text-xs" aria-label="Filtrar por categoria">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FILTER_ALL} className="text-xs">
                  Todas as categorias
                </SelectItem>
                <SelectItem value={FILTER_NONE} className="text-xs">
                  Sem categoria
                </SelectItem>
                {categoryFilterOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="text-xs">
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterBrandId} onValueChange={setFilterBrandId}>
              <SelectTrigger className="h-8 w-[130px] text-xs" aria-label="Filtrar por marca">
                <SelectValue placeholder="Marca" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FILTER_ALL} className="text-xs">
                  Todas as marcas
                </SelectItem>
                <SelectItem value={FILTER_NONE} className="text-xs">
                  Sem marca
                </SelectItem>
                {brandFilterOptions.map((b) => (
                  <SelectItem key={b.id} value={b.id} className="text-xs">
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setCreateModalOpen(true)} size="sm" className="h-8 text-xs gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Novo produto
          </Button>
        </PageToolbar>

        <div className="flex-1 overflow-auto p-5">
          {showInitialSkeleton && (
            <div className="space-y-2">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 text-xs">
              <p className="font-semibold text-destructive mb-1">Erro ao carregar produtos</p>
              <p className="text-muted-foreground mb-3">{error.message}</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Tentar novamente
              </Button>
            </div>
          )}

          {!showInitialSkeleton && !error && (
            <>
              {productsList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-sm mx-auto">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-4">
                    <Package className="h-7 w-7 text-muted-foreground/40" />
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
                    <Button onClick={() => setCreateModalOpen(true)} size="sm" className="gap-1.5">
                      <Plus className="h-3.5 w-3.5" />
                      Criar produto
                    </Button>
                  )}
                </div>
              ) : (
                <div
                  className={`rounded-xl border border-border overflow-hidden bg-card shadow-sm ${isRefreshing ? "opacity-60 pointer-events-none" : ""}`}
                >
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableHead className="w-14 text-xs">Img</TableHead>
                        <TableHead className="text-xs">Produto</TableHead>
                        <TableHead className="text-xs hidden md:table-cell">Categoria</TableHead>
                        <TableHead className="text-xs hidden md:table-cell">Marca</TableHead>
                        <TableHead className="text-xs hidden lg:table-cell">SKU</TableHead>
                        <TableHead className="text-xs hidden sm:table-cell">Desconto</TableHead>
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productsList.map((product) => {
                        let metadata: any = null
                        try {
                          metadata = product.metadata ? JSON.parse(product.metadata) : null
                        } catch {}

                        const isDeleting = deletingProductId === product.id

                        return (
                          <TableRow
                            key={product.id}
                            className="group cursor-pointer hover:bg-muted/20"
                          >
                            <TableCell className="py-2 px-3">
                              <Link href={`/dashboard/products/${product.id}`} className="block">
                                <div className="h-10 w-10 rounded-lg border border-border bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                                  {product.image ? (
                                    <Image
                                      src={product.image}
                                      alt={product.title}
                                      width={40}
                                      height={40}
                                      className="object-cover w-full h-full"
                                    />
                                  ) : (
                                    <Package className="h-4 w-4 text-muted-foreground/40" />
                                  )}
                                </div>
                              </Link>
                            </TableCell>

                            <TableCell className="py-2">
                              <Link href={`/dashboard/products/${product.id}`} className="block">
                                <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                  {product.title}
                                </span>
                                {product.description && (
                                  <span className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                                    {product.description}
                                  </span>
                                )}
                              </Link>
                            </TableCell>

                            <TableCell className="py-2 hidden md:table-cell">
                              {product.category ? (
                                <Badge variant="secondary" className="text-[11px] h-5 px-1.5">
                                  {product.category.name}
                                </Badge>
                              ) : (
                                <span className="text-[11px] text-muted-foreground/40">—</span>
                              )}
                            </TableCell>

                            <TableCell className="py-2 hidden md:table-cell">
                              {product.brand ? (
                                <Badge variant="outline" className="text-[11px] h-5 px-1.5 font-normal">
                                  {product.brand.name}
                                </Badge>
                              ) : (
                                <span className="text-[11px] text-muted-foreground/40">—</span>
                              )}
                            </TableCell>

                            <TableCell className="py-2 hidden lg:table-cell">
                              {metadata?.sku ? (
                                <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                                  <Tag className="h-3 w-3" />
                                  {metadata.sku}
                                </span>
                              ) : (
                                <span className="text-[11px] text-muted-foreground/40">—</span>
                              )}
                            </TableCell>

                            <TableCell className="py-2 hidden sm:table-cell">
                              {product.discount ? (
                                <Badge variant="outline" className="text-[11px] h-5 px-1.5 text-emerald-400 border-emerald-500/30">
                                  {product.discount}%
                                </Badge>
                              ) : (
                                <span className="text-[11px] text-muted-foreground/40">—</span>
                              )}
                            </TableCell>

                            <TableCell className="py-2 pr-3">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                    }}
                                    disabled={isDeleting}
                                  >
                                    {isDeleting ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <MoreVertical className="h-3.5 w-3.5" />
                                    )}
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                  <DropdownMenuItem asChild>
                                    <Link href={`/dashboard/products/${product.id}`} onClick={(e) => e.stopPropagation()}>
                                      <Eye className="h-3.5 w-3.5 mr-2" />
                                      Ver produto
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={(e) => handleDeleteProduct(product.id, product.title, e)}
                                    disabled={isDeleting}
                                  >
                                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between gap-2 border-t border-border bg-muted/20 px-3 py-2">
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        Página {pageIndex + 1} de {totalPages}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 p-0"
                          disabled={pageIndex <= 0 || isRefreshing}
                          onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                          aria-label="Página anterior"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 p-0"
                          disabled={pageIndex >= totalPages - 1 || isRefreshing}
                          onClick={() => setPageIndex((p) => p + 1)}
                          aria-label="Página seguinte"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <CreateProductModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
    </>
  )
}
