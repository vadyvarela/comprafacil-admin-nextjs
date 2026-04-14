"use client"

import { useState } from "react"
import { useQuery, useMutation } from "@apollo/client/react"
import { useParams, useRouter } from "next/navigation"
import { GET_PRODUCT, GET_PRODUCTS } from "@/lib/graphql/products/queries"
import { DELETE_PRODUCT } from "@/lib/graphql/products/mutations"
import type { Product, ProductVariant } from "@/lib/graphql/products/types"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { EditProductModal } from "@/components/products/edit-product-modal"
import { VariantManager } from "@/components/products/variant-manager"
import { ProductImageUpload } from "@/components/products/product-image-upload"
import { StockModal } from "@/components/products/stock-modal"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Pencil,
  MoreVertical,
  Trash2,
  Warehouse,
  Package,
  Loader2,
  ArrowLeft,
  Tag,
  Info,
  Settings,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { showToast } from "@/lib/utils/toast"

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [variantManagerOpen, setVariantManagerOpen] = useState(false)
  const [stockModalOpen, setStockModalOpen] = useState(false)


  const [deleteProduct, { loading: deletingProduct }] = useMutation(
    DELETE_PRODUCT,
    {
      onCompleted: () => {
        router.push("/dashboard/products")
      },
    }
  )

  const { data, loading, error } = useQuery<{ productDetails?: Product }>(GET_PRODUCT, {
    variables: { id: productId },
    skip: !productId,
  })

  const { data: productsData } = useQuery<{
    products?: { data?: Array<{ id: string; brand?: Product["brand"] }> }
  }>(GET_PRODUCTS, {
    variables: {
      page: {
        page: 0,
        size: 1000,
        sortBy: "createdAt",
        sortDirection: "DESC",
      },
    },
    skip: !productId,
  })

  const product = data?.productDetails
  const fallbackBrand = productsData?.products?.data?.find((item) => item.id === product?.id)?.brand
  const productForEditing =
    product
      ? {
          ...product,
          brand: product.brand ?? fallbackBrand ?? null,
        }
      : null

  const metadata = product?.metadata
    ? (() => {
        try {
          return JSON.parse(product.metadata)
        } catch {
          return null
        }
      })()
    : null
  const summaryPreview = product?.summary
    ? product.summary.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
    : ""

  const handleDeleteProduct = async () => {
    if (
      !confirm(
        `Tem certeza que deseja excluir o produto "${product?.title}"?\n\nEsta ação irá excluir o produto e todas as suas variantes. Esta ação não pode ser desfeita.`
      )
    ) {
      return
    }

    try {
      await deleteProduct({ variables: { id: productId } })
      showToast.success("Produto excluído", `O produto "${product?.title}" foi excluído com sucesso`)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao excluir produto. Tente novamente."
      console.error("Error deleting product:", err)
      showToast.error("Erro ao excluir produto", errorMessage)
    }
  }

  if (loading) {
    return (
      <>
        <DashboardHeader items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Produtos", href: "/dashboard/products" }, { label: "…" }]} />
        <div className="flex flex-col gap-4 p-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </>
    )
  }

  if (error || !product) {
    return (
      <>
        <DashboardHeader items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Produtos", href: "/dashboard/products" }, { label: "Detalhe" }]} />
        <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
          <div className="text-center space-y-3 max-w-md">
            <Package className="h-10 w-10 mx-auto text-muted-foreground" />
            <div>
              <h2 className="text-lg font-semibold">
                {error ? "Erro ao carregar produto" : "Produto não encontrado"}
              </h2>
              {error && (
                <p className="text-sm text-muted-foreground mt-1">
                  {error.message}
                </p>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/products")}>
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
              Voltar
            </Button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <DashboardHeader items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Produtos", href: "/dashboard/products" }, { label: product.title ?? "Produto" }]} />
      <div className="flex flex-1 flex-col">
          {/* Header */}
          <div className="border-b px-4 py-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-semibold truncate">
                    {product.title}
                  </h1>
                  {product.category && (
                    <Badge variant="secondary" className="text-xs">
                      {product.category.name}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {product.type.code}
                  </Badge>
                </div>
                {summaryPreview && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {summaryPreview}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setEditModalOpen(true)}
                  size="sm"
                  variant="outline"
                >
                  <Pencil className="h-3.5 w-3.5 mr-1.5" />
                  Editar
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={deletingProduct}
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={handleDeleteProduct}
                      disabled={deletingProduct}
                    >
                      {deletingProduct ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                          Excluindo...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-3.5 w-3.5 mr-2" />
                          Excluir Produto
                        </>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-4">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Sidebar */}
              <div className="lg:col-span-1 space-y-4">
                {/* Image Upload */}
                <div className="border rounded p-3">
                  <ProductImageUpload 
                    productId={productId} 
                    currentImage={product.image} 
                  />
                </div>

                {/* Stock Total */}
                <div className="border rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Warehouse className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">Estoque Total</span>
                    </div>
                    {product.stock && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => setStockModalOpen(true)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  {product.stock ? (
                    <div>
                      <p className="text-2xl font-semibold">{product.stock.quantity}</p>
                      {product.stock.name && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {product.stock.name}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Não configurado
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-7 text-xs"
                        onClick={() => setStockModalOpen(true)}
                      >
                        Configurar Estoque
                      </Button>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="border rounded p-3">
                  <div className="flex items-center gap-1.5 mb-3">
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Informações</span>
                  </div>
                  <div className="space-y-2.5 text-xs">
                    <div>
                      <p className="text-muted-foreground mb-0.5">ID</p>
                      <p className="font-mono text-[10px] break-all">{product.id}</p>
                    </div>
                    {product.discount !== undefined && product.discount !== null && product.discount > 0 && (
                      <div>
                        <p className="text-muted-foreground mb-0.5">Desconto</p>
                        <p className="font-medium text-red-600">{product.discount}%</p>
                      </div>
                    )}
                    {metadata?.sku && (
                      <div>
                        <p className="text-muted-foreground mb-0.5 flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          SKU
                        </p>
                        <p className="font-medium">{metadata.sku}</p>
                      </div>
                    )}
                    {metadata?.model && (
                      <div>
                        <p className="text-muted-foreground mb-0.5">Modelo</p>
                        <p className="font-medium">{metadata.model}</p>
                      </div>
                    )}
                    {metadata?.weight && (
                      <div>
                        <p className="text-muted-foreground mb-0.5">Peso</p>
                        <p className="font-medium">{metadata.weight}</p>
                      </div>
                    )}
                    {metadata?.color && (
                      <div>
                        <p className="text-muted-foreground mb-0.5">Cor</p>
                        <p className="font-medium">{metadata.color}</p>
                      </div>
                    )}
                    {metadata?.warranty && (
                      <div>
                        <p className="text-muted-foreground mb-0.5">Garantia</p>
                        <p className="font-medium">{metadata.warranty}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-base font-semibold">Variantes</h2>
                    <p className="text-xs text-muted-foreground">
                      {product.variants?.length || 0} variante
                      {product.variants?.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <Button
                    onClick={() => setVariantManagerOpen(true)}
                    size="sm"
                  >
                    <Settings className="h-3.5 w-3.5 mr-1.5" />
                    Gerenciar Variantes
                  </Button>
                </div>

                {product.variants && product.variants.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted/50 border-b">
                          <tr>
                            <th className="text-left p-3 text-xs font-medium text-muted-foreground">
                              Variante
                            </th>
                            <th className="text-left p-3 text-xs font-medium text-muted-foreground">
                              Preço
                            </th>
                            <th className="text-left p-3 text-xs font-medium text-muted-foreground">
                              Estoque
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {product.variants.map((variant: ProductVariant) => {
                            const variantMetadata = variant.metadata
                              ? (() => {
                                  try {
                                    return JSON.parse(variant.metadata)
                                  } catch {
                                    return null
                                  }
                                })()
                              : null
                            const attributes = variantMetadata?.attributes || {}

                            return (
                              <tr
                                key={variant.id}
                                className="border-b hover:bg-muted/30 transition-colors"
                              >
                                <td className="p-3">
                                  <div>
                                    <div className="font-medium text-sm">{variant.title}</div>
                                    {variantMetadata?.sku && (
                                      <Badge variant="secondary" className="text-xs mt-1">
                                        SKU: {variantMetadata.sku}
                                      </Badge>
                                    )}
                                    {Object.keys(attributes).length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {Object.entries(attributes).map(([key, value]) => (
                                          <Badge key={key} variant="outline" className="text-xs">
                                            {key}: {String(value)}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3">
                                  {variant.price ? (
                                    <span className="text-sm font-medium">
                                      {(variant.price.unitAmount / 100).toLocaleString("pt-PT", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}{" "}
                                      {variant.price.currency}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">Sem preço</span>
                                  )}
                                </td>
                                <td className="p-3">
                                  <div className="flex items-center gap-1.5 text-sm">
                                    <Warehouse className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="font-medium">{variant.quantity || 0}</span>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center border rounded">
                    <Package className="h-8 w-8 text-muted-foreground mb-2" />
                    <h3 className="text-sm font-medium mb-1">
                      Nenhuma variante
                    </h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      Gerencie variantes, preços e estoque em um só lugar
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setVariantManagerOpen(true)}
                    >
                      <Settings className="h-3.5 w-3.5 mr-1.5" />
                      Gerenciar Variantes
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        <EditProductModal
          product={productForEditing}
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
        />

        <VariantManager
          productId={productId}
          open={variantManagerOpen}
          onOpenChange={setVariantManagerOpen}
        />

        <StockModal
          stock={product.stock ? {
            id: product.stock.id,
            quantity: product.stock.quantity,
            name: product.stock.name || "",
            productId: product.id,
          } : null}
          open={stockModalOpen}
          onOpenChange={setStockModalOpen}
          productId={productId}
        />
    </>
  )
}
