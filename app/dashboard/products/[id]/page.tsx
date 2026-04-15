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
  Layers,
  BoxesIcon,
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
  const variantCount = product?.variants?.length ?? 0
  const totalVariantStock =
    product?.variants?.reduce((total, variant) => total + (variant.quantity || 0), 0) ?? 0

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
        <div className="flex flex-col gap-4 p-6">
          <Skeleton className="h-10 w-72" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </>
    )
  }

  if (error || !product) {
    return (
      <>
        <DashboardHeader items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Produtos", href: "/dashboard/products" }, { label: "Detalhe" }]} />
        <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
          <div className="text-center space-y-4 max-w-md">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
              <Package className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {error ? "Erro ao carregar produto" : "Produto não encontrado"}
              </h2>
              {error && (
                <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/products")}>
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
              Voltar aos produtos
            </Button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <DashboardHeader items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Produtos", href: "/dashboard/products" }, { label: product.title ?? "Produto" }]} />
      <div className="flex flex-1 flex-col bg-grid">
        <div className="flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-7xl px-5 py-6 md:px-6 space-y-6">

            {/* Hero section */}
            <div className="animate-enter relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-primary/[0.03] p-6">
              <div className="absolute inset-0 bg-grid opacity-40" />
              <div className="relative flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 -ml-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => router.push("/dashboard/products")}
                  >
                    <ArrowLeft className="mr-1 h-3 w-3" />
                    Produtos
                  </Button>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="truncate text-2xl font-bold md:text-3xl">
                      {product.title}
                    </h1>
                    {product.category && (
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                        {product.category.name}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs font-mono text-muted-foreground">
                      {product.type.code}
                    </Badge>
                  </div>
                  {product.brand && (
                    <p className="text-sm text-muted-foreground">
                      por <span className="font-medium text-foreground">{product.brand.name}</span>
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button onClick={() => setEditModalOpen(true)} size="sm">
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    Editar
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" disabled={deletingProduct}>
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
                            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                            Excluindo...
                          </>
                        ) : (
                          <>
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            Excluir Produto
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Mini KPIs */}
              <div className="relative mt-5 grid gap-3 sm:grid-cols-3">
                <div className="group flex items-center gap-3 rounded-xl glass-card p-3.5 transition-colors hover:bg-white/[0.05]">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                    <Layers className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Variantes</p>
                    <p className="text-xl font-bold tabular-nums leading-tight">{variantCount}</p>
                  </div>
                </div>
                <div className="group flex items-center gap-3 rounded-xl glass-card p-3.5 transition-colors hover:bg-white/[0.05]">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                    <BoxesIcon className="h-4 w-4 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Stock variantes</p>
                    <p className="text-xl font-bold tabular-nums leading-tight">{totalVariantStock}</p>
                  </div>
                </div>
                <div className="group flex items-center gap-3 rounded-xl glass-card p-3.5 transition-colors hover:bg-white/[0.05]">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                    <Warehouse className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Stock total</p>
                    <p className="text-xl font-bold tabular-nums leading-tight">{product.stock?.quantity ?? 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Content grid */}
            <div className="grid gap-5 lg:grid-cols-3 animate-enter-delay-1">
              {/* Left sidebar */}
              <div className="space-y-5 lg:col-span-1">
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <ProductImageUpload productId={productId} currentImage={product.image} />
                </div>

                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/10">
                        <Warehouse className="h-3 w-3 text-emerald-400" />
                      </div>
                      <span className="text-xs font-semibold">Estoque</span>
                    </div>
                    {product.stock && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => setStockModalOpen(true)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <div className="p-4">
                    {product.stock ? (
                      <div>
                        <p className="text-3xl font-bold tabular-nums">{product.stock.quantity}</p>
                        {product.stock.name && (
                          <p className="mt-1 text-xs text-muted-foreground">{product.stock.name}</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs text-muted-foreground">Estoque não configurado</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-full text-xs"
                          onClick={() => setStockModalOpen(true)}
                        >
                          Configurar Estoque
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
                      <Info className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-xs font-semibold">Informações</span>
                  </div>
                  <div className="p-4 space-y-3 text-xs">
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-border">
                      <span className="text-muted-foreground shrink-0">ID</span>
                      <span className="break-all font-mono text-[10px] text-right">{product.id}</span>
                    </div>
                    {product.discount !== undefined && product.discount !== null && product.discount > 0 && (
                      <div className="flex items-center justify-between gap-3 pb-3 border-b border-border">
                        <span className="text-muted-foreground">Desconto</span>
                        <span className="inline-flex items-center rounded-full bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[11px] font-semibold text-rose-400">
                          -{product.discount}%
                        </span>
                      </div>
                    )}
                    {metadata?.sku && (
                      <div className="flex items-center justify-between gap-3 pb-3 border-b border-border">
                        <span className="text-muted-foreground flex items-center gap-1"><Tag className="h-3 w-3" />SKU</span>
                        <span className="font-mono font-medium">{metadata.sku}</span>
                      </div>
                    )}
                    {metadata?.model && (
                      <div className="flex items-center justify-between gap-3 pb-3 border-b border-border">
                        <span className="text-muted-foreground">Modelo</span>
                        <span className="font-medium">{metadata.model}</span>
                      </div>
                    )}
                    {metadata?.weight && (
                      <div className="flex items-center justify-between gap-3 pb-3 border-b border-border">
                        <span className="text-muted-foreground">Peso</span>
                        <span className="font-medium">{metadata.weight}</span>
                      </div>
                    )}
                    {metadata?.color && (
                      <div className="flex items-center justify-between gap-3 pb-3 border-b border-border">
                        <span className="text-muted-foreground">Cor</span>
                        <span className="font-medium">{metadata.color}</span>
                      </div>
                    )}
                    {metadata?.warranty && (
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Garantia</span>
                        <span className="font-medium">{metadata.warranty}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Variants */}
              <div className="lg:col-span-2">
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                        <Settings className="h-4 w-4 text-blue-400" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold">Variantes</h2>
                        <p className="text-[11px] text-muted-foreground">
                          {variantCount} variante{variantCount !== 1 ? "s" : ""} registada{variantCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <Button onClick={() => setVariantManagerOpen(true)} size="sm">
                      <Settings className="mr-1.5 h-3.5 w-3.5" />
                      Gerenciar
                    </Button>
                  </div>

                  {product.variants && product.variants.length > 0 ? (
                    <div className="divide-y divide-border">
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
                          <div
                            key={variant.id}
                            className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/20"
                          >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                              <Package className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">{variant.title}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {variantMetadata?.sku && (
                                  <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                                    SKU: {variantMetadata.sku}
                                  </span>
                                )}
                                {Object.entries(attributes).map(([key, value]) => (
                                  <span key={key} className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                    {key}: {String(value)}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="text-right shrink-0 space-y-0.5">
                              {variant.price ? (
                                <p className="text-sm font-bold tabular-nums">
                                  {(variant.price.unitAmount / 100).toLocaleString("pt-PT", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}{" "}
                                  <span className="text-[10px] text-muted-foreground font-normal">{variant.price.currency}</span>
                                </p>
                              ) : (
                                <p className="text-xs text-muted-foreground">Sem preço</p>
                              )}
                              <p className="text-[11px] text-muted-foreground tabular-nums flex items-center justify-end gap-1">
                                <Warehouse className="h-3 w-3" />
                                {variant.quantity || 0} un.
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50 mb-4">
                        <Package className="h-7 w-7 text-muted-foreground/40" />
                      </div>
                      <h3 className="text-sm font-bold mb-1">Nenhuma variante</h3>
                      <p className="text-xs text-muted-foreground max-w-[260px] mb-4">
                        Adicione variantes para definir preços, estoque e atributos do produto.
                      </p>
                      <Button size="sm" onClick={() => setVariantManagerOpen(true)}>
                        <Settings className="mr-1.5 h-3.5 w-3.5" />
                        Gerenciar Variantes
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
