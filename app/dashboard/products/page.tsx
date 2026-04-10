"use client"

import { useState } from "react"
import { useQuery, useMutation } from "@apollo/client/react"
import { GET_PRODUCTS } from "@/lib/graphql/products/queries"
import { DELETE_PRODUCT } from "@/lib/graphql/products/mutations"
import { Product } from "@/lib/graphql/products/types"
import { DashboardHeader } from "@/components/layout/dashboard-header"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
            <div className="space-y-2">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
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
                <div className="rounded-xl border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableHead className="w-14 text-xs">Img</TableHead>
                        <TableHead className="text-xs">Produto</TableHead>
                        <TableHead className="text-xs hidden md:table-cell">Categoria</TableHead>
                        <TableHead className="text-xs hidden lg:table-cell">SKU</TableHead>
                        <TableHead className="text-xs hidden lg:table-cell">Tipo</TableHead>
                        <TableHead className="text-xs hidden sm:table-cell">Desconto</TableHead>
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product) => {
                        let metadata: any = null
                        try {
                          metadata = product.metadata ? JSON.parse(product.metadata) : null
                        } catch {}

                        const isDeleting = deletingProductId === product.id

                        return (
                          <TableRow
                            key={product.id}
                            className="group cursor-pointer hover:bg-muted/30"
                          >
                            {/* Imagem */}
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

                            {/* Título */}
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

                            {/* Categoria */}
                            <TableCell className="py-2 hidden md:table-cell">
                              {product.category ? (
                                <Badge variant="secondary" className="text-[11px] h-5 px-1.5">
                                  {product.category.name}
                                </Badge>
                              ) : (
                                <span className="text-[11px] text-muted-foreground/40">—</span>
                              )}
                            </TableCell>

                            {/* SKU */}
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

                            {/* Tipo */}
                            <TableCell className="py-2 hidden lg:table-cell">
                              <span className="text-[11px] text-muted-foreground font-mono">
                                {product.type?.code ?? "—"}
                              </span>
                            </TableCell>

                            {/* Desconto */}
                            <TableCell className="py-2 hidden sm:table-cell">
                              {product.discount ? (
                                <Badge variant="outline" className="text-[11px] h-5 px-1.5 text-green-600 border-green-200">
                                  {product.discount}%
                                </Badge>
                              ) : (
                                <span className="text-[11px] text-muted-foreground/40">—</span>
                              )}
                            </TableCell>

                            {/* Ações */}
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
