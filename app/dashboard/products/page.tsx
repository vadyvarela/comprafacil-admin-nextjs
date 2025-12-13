"use client"

import { useState } from "react"
import { useQuery, useMutation } from "@apollo/client/react"
import { GET_PRODUCTS } from "@/lib/graphql/products/queries"
import { DELETE_PRODUCT } from "@/lib/graphql/products/mutations"
import { Product } from "@/lib/graphql/products/types"
import { AppSidebar } from "@/components/app-sidebar"
import { CreateProductModal } from "@/components/products/create-product-modal"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
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

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Produtos</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col">
          {/* Header */}
          <div className="border-b px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h1 className="text-xl font-semibold">Produtos</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {data?.products.totalElements || 0} produto
                  {(data?.products.totalElements || 0) !== 1 ? "s" : ""}
                </p>
              </div>
              <Button
                onClick={() => setCreateModalOpen(true)}
                size="sm"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Novo
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 h-8 text-sm"
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-4">
            {loading && (
              <div className="space-y-2">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded" />
                ))}
              </div>
            )}

            {error && (
              <div className="p-3 rounded border border-destructive/50 bg-destructive/10 text-sm">
                <p className="font-medium text-destructive mb-1">Erro ao carregar</p>
                <p className="text-muted-foreground text-xs">{error.message}</p>
                {error.message?.includes("JDBC Connection") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                    className="mt-2"
                  >
                    Tentar Novamente
                  </Button>
                )}
              </div>
            )}

            {!loading && !error && (
              <>
                {filteredProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Package className="h-8 w-8 text-muted-foreground mb-3" />
                    <h3 className="text-sm font-medium mb-1">
                      {searchQuery ? "Nenhum resultado" : "Nenhum produto"}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      {searchQuery
                        ? "Tente ajustar sua busca"
                        : "Comece criando seu primeiro produto"}
                    </p>
                    {!searchQuery && (
                      <Button
                        onClick={() => setCreateModalOpen(true)}
                        size="sm"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Criar Produto
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
      </SidebarInset>
    </SidebarProvider>
  )
}
