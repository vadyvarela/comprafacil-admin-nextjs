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
  Edit2,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
            const metadata = product.metadata ? JSON.parse(product.metadata) : null
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
        <div className="border-b border-border bg-card/60 backdrop-blur">
          <div className="px-5 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-base font-bold tracking-tight text-foreground">Produtos</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {loading ? "A carregar…" : `${total} produto${total !== 1 ? "s" : ""} no catálogo`}
                </p>
              </div>
              <div className="flex gap-2">
                <div className="relative w-56 sm:w-64">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Título, descrição, SKU…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-xs"
                  />
                </div>
                <Button onClick={() => setCreateModalOpen(true)} size="sm" className="h-8 text-xs gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Novo produto
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-5">
          {loading && (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(9)].map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl border border-destructive/40 bg-destructive/5 text-xs">
              <p className="font-semibold text-destructive mb-1">Erro ao carregar produtos</p>
              <p className="text-muted-foreground mb-3">{error.message}</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Tentar novamente
              </Button>
            </div>
          )}

          {!loading && !error && (
            <>
              {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-sm mx-auto">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-4">
                    <Package className="h-7 w-7 text-muted-foreground/50" />
                  </div>
                  <h2 className="text-sm font-semibold text-foreground mb-1">
                    {searchQuery ? "Nenhum resultado" : "Sem produtos"}
                  </h2>
                  <p className="text-xs text-muted-foreground mb-4">
                    {searchQuery
                      ? "Tente outro termo de busca."
                      : "Crie o primeiro produto para começar."}
                  </p>
                  {!searchQuery && (
                    <Button onClick={() => setCreateModalOpen(true)} size="sm" className="gap-1.5">
                      <Plus className="h-3.5 w-3.5" />
                      Criar produto
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredProducts.map((product) => {
                    let metadata: any = null
                    try {
                      metadata = product.metadata ? JSON.parse(product.metadata) : null
                    } catch {}

                    const isDeleting = deletingProductId === product.id

                    return (
                      <div key={product.id} className="group relative">
                        <Link href={`/dashboard/products/${product.id}`} className="block">
                          <div className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all">
                            {/* Product icon */}
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5">
                              <Package className="h-5 w-5" />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors leading-tight">
                                {product.title}
                              </h3>
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                {product.category && (
                                  <Badge variant="secondary" className="text-[11px] h-5 px-1.5">
                                    {product.category.name}
                                  </Badge>
                                )}
                                {metadata?.sku && (
                                  <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                                    <Tag className="h-3 w-3" />
                                    {metadata.sku}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-muted-foreground/60 mt-1 font-mono">
                                {product.type?.code}
                              </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
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

      <CreateProductModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
    </>
  )
}
