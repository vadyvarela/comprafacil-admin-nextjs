"use client"

import { useState } from "react"
import { useQuery, useMutation } from "@apollo/client/react"
import { GET_PRODUCTS } from "@/lib/graphql/products/queries"
import { DELETE_PRODUCT } from "@/lib/graphql/products/mutations"
import { Product } from "@/lib/graphql/products/types"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { CreateProductModal } from "@/components/products/create-product-modal"
import Link from "next/link"
import {
  Package,
  Plus,
  Search,
  ArrowRight,
  Tag,
  MoreVertical,
  Trash2,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { showToast } from "@/lib/utils/toast"

export default function ProductsPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null)

  const { data, loading, error, refetch } = useQuery<{
    products: {
      data: Product[]
      pageNumber: number
      pageSize: number
      totalElements: number
      totalPages: number
    }
  }>(GET_PRODUCTS, {
    variables: {
      page: {
        page: 0,
        size: 100,
      },
    },
  })

  const [deleteProduct] = useMutation(DELETE_PRODUCT, {
    refetchQueries: [{ query: GET_PRODUCTS, variables: { page: { page: 0, size: 100 } } }],
  })

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
      showToast.success("Produto excluído", `O produto "${productTitle}" foi excluído com sucesso`)
    } catch (err: any) {
      console.error("Error deleting product:", err)
      const errorMessage = err?.message || "Erro ao excluir produto. Tente novamente."
      showToast.error("Erro ao excluir produto", errorMessage)
    } finally {
      setDeletingProductId(null)
    }
  }

  const filteredProducts =
    data?.products.data.filter((product) => {
      if (!searchQuery.trim()) return true
      const query = searchQuery.toLowerCase()
      return (
        product.title.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        (() => {
          try {
            const metadata = product.metadata
              ? JSON.parse(product.metadata)
              : null
            return metadata?.sku?.toLowerCase().includes(query)
          } catch {
            return false
          }
        })()
      )
    }) || []

  const total = data?.products.totalElements ?? 0

  return (
    <>
      <DashboardHeader items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Produtos" }]} />
      <div className="flex flex-1 flex-col min-h-0">
        {/* Toolbar */}
        <div className="border-b border-border bg-card">
          <div className="px-4 py-2.5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-base font-semibold tracking-tight">Produtos</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {total} produto{total !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <div className="relative w-56 sm:w-64">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" aria-hidden />
                  <Input
                    placeholder="Título, descrição, SKU…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-xs"
                    aria-label="Buscar produtos"
                  />
                </div>
                <Button onClick={() => setCreateModalOpen(true)} size="sm" className="h-8 text-xs">
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Novo
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 pt-3">
            {loading && (
              <div className="space-y-2">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded" />
                ))}
              </div>
            )}

            {error && (
              <div className="p-2.5 rounded-md border border-destructive/50 bg-destructive/10 text-xs">
                <p className="font-medium text-destructive mb-1">Erro ao carregar</p>
                <p className="text-muted-foreground mb-2">{error.message}</p>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  Tentar novamente
                </Button>
              </div>
            )}

            {!loading && !error && (
              <>
                {filteredProducts.length === 0 ? (
                  <div
                    className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-sm mx-auto"
                    role="status"
                    aria-label={searchQuery ? "Nenhum resultado" : "Nenhum produto"}
                  >
                    <Package className="h-10 w-10 text-muted-foreground mb-4" />
                    <h2 className="text-sm font-semibold text-foreground mb-1">
                      {searchQuery ? "Nenhum resultado" : "Nenhum produto"}
                    </h2>
                    <p className="text-xs text-muted-foreground mb-4">
                      {searchQuery
                        ? "Tente outro termo ou remova o filtro de busca."
                        : "Crie o primeiro produto para começar."}
                    </p>
                    {!searchQuery && (
                      <Button onClick={() => setCreateModalOpen(true)} size="sm">
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Criar produto
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredProducts.map((product) => {
                      let metadata = null
                      try {
                        metadata = product.metadata
                          ? JSON.parse(product.metadata)
                          : null
                      } catch (e) {}

                      return (
                        <div
                          key={product.id}
                          className="group relative"
                        >
                          <Link
                            href={`/dashboard/products/${product.id}`}
                            className="block"
                          >
                            <div className="flex items-center gap-3 p-3 rounded border hover:bg-accent/50 hover:border-border transition-colors">
                              <div className="h-8 w-8 rounded bg-muted flex items-center justify-center flex-shrink-0">
                                <Package className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <h3 className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                                    {product.title}
                                  </h3>
                                  {product.category && (
                                    <Badge variant="secondary" className="text-xs px-1.5 py-0">
                                      {product.category.name}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  {metadata?.sku && (
                                    <span className="flex items-center gap-1">
                                      <Tag className="h-3 w-3" />
                                      {metadata.sku}
                                    </span>
                                  )}
                                  <span className="text-muted-foreground/60">
                                    {product.type.code}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={(e) => e.preventDefault()}
                                      disabled={deletingProductId === product.id}
                                    >
                                      {deletingProductId === product.id ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      ) : (
                                        <MoreVertical className="h-3.5 w-3.5" />
                                      )}
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onClick={(e) => handleDeleteProduct(product.id, product.title, e)}
                                      disabled={deletingProductId === product.id}
                                    >
                                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                                      Excluir
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                          </Link>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
        </div>
      </div>

      <CreateProductModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
        />
    </>
  )
}
