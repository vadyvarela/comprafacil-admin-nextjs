"use client"

import { useState, type ReactNode } from "react"
import { useQuery, useMutation } from "@apollo/client/react"
import { useParams, useRouter } from "next/navigation"
import { GET_PRODUCT, GET_PRODUCTS } from "@/lib/graphql/products/queries"
import { DELETE_PRODUCT, UPDATE_PRODUCT } from "@/lib/graphql/products/mutations"
import type { Product, ProductVariant } from "@/lib/graphql/products/types"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { EditProductModal } from "@/components/products/edit-product-modal"
import { MetaCatalogPreview } from "@/components/products/meta-catalog-preview"
import { VariantManager } from "@/components/products/variant-manager"
import { ProductOptionCatalogPanel } from "@/components/products/product-option-catalog-panel"
import { ProductGalleryUpload } from "@/components/products/product-gallery-upload"
import { StockModal } from "@/components/products/stock-modal"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
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
  Globe,
  EyeOff,
  ChevronDown,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { showToast } from "@/lib/utils/toast"
import { looksLikeIphoneProduct } from "@/lib/utils/iphone-seminovo-metadata"
import { parseProductOffer } from "@/lib/products/product-offer"
import { parseVariantMetadata } from "@/lib/products/variant-metadata"
import { cn } from "@/lib/utils"
import {
  isProductDraft,
  productVisibilityLabel,
  productVisibilityToggleCode,
  productVisibilityToggleLabel,
  productVisibilityUpdateInput,
} from "@/lib/products/product-visibility"

function parseMetadata(metadataJson?: string | null): Record<string, unknown> | null {
  if (!metadataJson) return null
  try {
    return JSON.parse(metadataJson) as Record<string, unknown>
  } catch {
    return null
  }
}

function metadataText(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null
  return String(value)
}

function stripHtml(value?: string | null): string {
  return (value ?? "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function compactText(value: string, limit = 220) {
  if (value.length <= limit) return value
  return `${value.slice(0, limit).trimEnd()}...`
}

function formatMoney(unitAmount: number, currency = "CVE") {
  return `${(unitAmount / 100).toLocaleString("pt-PT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`
}

function variantPriceLabel(variant: ProductVariant) {
  if (!variant.price) return "Sem preço"
  return formatMoney(variant.price.unitAmount, variant.price.currency)
}

function variantPriceSummary(variants: ProductVariant[]) {
  const prices = variants
    .map((variant) => variant.price)
    .filter((price): price is NonNullable<ProductVariant["price"]> => !!price)

  if (prices.length === 0) return "Sem preços"

  const currency = prices[0]?.currency ?? "CVE"
  const values = prices.map((price) => price.unitAmount)
  const min = Math.min(...values)
  const max = Math.max(...values)

  if (min === max) return formatMoney(min, currency)
  return `${formatMoney(min, currency)} - ${formatMoney(max, currency)}`
}

function DetailItem({
  label,
  value,
  mono,
}: {
  label: string
  value: ReactNode
  mono?: boolean
}) {
  return (
    <div className="min-w-0 rounded-md border border-border/70 bg-muted/20 px-3 py-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <div
        className={cn(
          "mt-0.5 min-w-0 break-words text-sm font-medium text-foreground",
          mono && "font-mono text-xs",
        )}
      >
        {value}
      </div>
    </div>
  )
}

function ProductMetric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: ReactNode
  tone: string
}) {
  return (
    <div className="flex min-h-16 min-w-0 items-center gap-3 rounded-md border border-border/75 bg-muted/20 px-3 py-2.5">
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/60",
          tone,
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-semibold tabular-nums">{value}</p>
      </div>
    </div>
  )
}

function ProductInfoPanel({
  product,
  metadata,
  showIphoneSeminovoRead,
  variantCount,
}: {
  product: Product
  metadata: Record<string, unknown> | null
  showIphoneSeminovoRead: boolean
  variantCount: number
}) {
  const productOffer = parseProductOffer(metadata?.productOffer)
  const details = [
    { label: "ID", value: product.id, mono: true },
    { label: "SKU", value: metadataText(metadata?.sku), mono: true },
    { label: "Modelo", value: metadataText(metadata?.model) },
    { label: "Peso", value: metadataText(metadata?.weight) },
    { label: "Cor", value: metadataText(metadata?.color) },
    { label: "Garantia", value: metadataText(metadata?.warranty) },
  ].filter((item) => item.value)

  return (
    <div className="rounded-lg border border-border/80 bg-card shadow-none">
      <div className="flex items-center gap-2.5 border-b border-border/80 bg-muted/25 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border/60 bg-primary/10">
          <Info className="h-4 w-4 text-primary" />
        </div>
        <h2 className="text-sm font-medium">Informações internas</h2>
      </div>
      <div className="grid gap-2 p-4 sm:grid-cols-2">
        {details.map((item) => (
          <DetailItem key={item.label} label={item.label} value={item.value} mono={item.mono} />
        ))}

        {product.discount !== undefined &&
        product.discount !== null &&
        product.discount > 0 &&
        variantCount === 0 ? (
          <DetailItem
            label="Desconto"
            value={
              <span className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-800">
                -{product.discount}%
              </span>
            }
          />
        ) : null}

        {showIphoneSeminovoRead && variantCount === 0 && metadata?.semFaceId === true ? (
          <DetailItem label="Face ID" value="Sem Face ID" />
        ) : null}

        {showIphoneSeminovoRead &&
        variantCount === 0 &&
        metadata?.batteryHealthPercent !== undefined &&
        metadata?.batteryHealthPercent !== null ? (
          <DetailItem label="Bateria" value={`${String(metadata.batteryHealthPercent)}%`} />
        ) : null}

        {productOffer?.enabled && variantCount === 0 ? (
          <DetailItem
            label="Oferta"
            value={
              <span>
                {productOffer.title}
                <span className="block text-[11px] font-normal text-muted-foreground">
                  {productOffer.items.join(" / ")}
                </span>
              </span>
            }
          />
        ) : null}
      </div>
    </div>
  )
}

function VariantRow({
  variant,
  showIphoneSeminovoRead,
}: {
  variant: ProductVariant
  showIphoneSeminovoRead: boolean
}) {
  const [open, setOpen] = useState(false)
  const parsed = parseVariantMetadata(variant.image, variant.metadata)
  const attributes = Object.entries(parsed.attributes).filter(([, value]) => String(value).trim())
  const galleryCount = parsed.images.length

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="px-4 py-3 transition-colors hover:bg-muted/20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border/70 bg-muted/40">
              {parsed.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={parsed.image} alt="" className="h-full w-full object-contain p-1" />
              ) : (
                <Package className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{variant.title}</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {attributes.length > 0 ? (
                  attributes.slice(0, 3).map(([key, value]) => (
                    <Badge key={key} variant="secondary" className="text-[10px] font-normal">
                      {key}: {String(value)}
                    </Badge>
                  ))
                ) : (
                  <span className="text-[11px] text-muted-foreground">Sem atributos</span>
                )}
                {attributes.length > 3 ? (
                  <Badge variant="outline" className="text-[10px]">
                    +{attributes.length - 3}
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>

          <div className="grid min-w-0 grid-cols-2 gap-2 sm:w-56 sm:shrink-0">
            <div className="rounded-md bg-muted/25 px-2.5 py-1.5">
              <p className="text-[10px] text-muted-foreground">Preço</p>
              <p className="truncate text-xs font-semibold tabular-nums">
                {variantPriceLabel(variant)}
              </p>
            </div>
            <div className="rounded-md bg-muted/25 px-2.5 py-1.5">
              <p className="text-[10px] text-muted-foreground">Stock</p>
              <p className="text-xs font-semibold tabular-nums">{variant.quantity || 0} un.</p>
            </div>
          </div>

          <CollapsibleTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="h-8 self-start text-xs">
              <ChevronDown
                className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")}
              />
              Mais
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent>
          <div className="mt-3 grid gap-2 rounded-md border border-border/70 bg-muted/20 p-3 sm:grid-cols-2 xl:grid-cols-4">
            <DetailItem label="ID" value={variant.id} mono />
            {parsed.sku ? <DetailItem label="SKU" value={parsed.sku} mono /> : null}
            {galleryCount > 0 ? <DetailItem label="Fotos" value={galleryCount} /> : null}
            {showIphoneSeminovoRead && parsed.semFaceId ? (
              <DetailItem label="Face ID" value="Sem Face ID" />
            ) : null}
            {showIphoneSeminovoRead &&
            parsed.batteryHealthPercent !== undefined &&
            parsed.batteryHealthPercent !== null ? (
              <DetailItem label="Bateria" value={`${parsed.batteryHealthPercent}%`} />
            ) : null}
            {parsed.discount !== undefined && parsed.discount !== null && parsed.discount > 0 ? (
              <DetailItem label="Desconto" value={`-${parsed.discount}%`} />
            ) : null}
            {parsed.productOffer?.enabled ? (
              <DetailItem
                label="Pack"
                value={
                  <span>
                    {parsed.productOffer.title}
                    <span className="block text-[11px] font-normal text-muted-foreground">
                      {parsed.productOffer.items.join(" / ")}
                    </span>
                  </span>
                }
              />
            ) : null}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [variantManagerOpen, setVariantManagerOpen] = useState(false)
  const [stockModalOpen, setStockModalOpen] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)

  const [deleteProduct, { loading: deletingProduct }] = useMutation(
    DELETE_PRODUCT,
    {
      onCompleted: () => {
        router.push("/dashboard/products")
      },
    }
  )

  const [updateProduct, { loading: updatingVisibility }] = useMutation(UPDATE_PRODUCT)

  const { data, loading, error, refetch } = useQuery<{ productDetails?: Product }>(
    GET_PRODUCT,
    {
      variables: { id: productId },
      skip: !productId,
    },
  )

  const { data: productsData } = useQuery<{
    products?: { data?: Array<{ id: string; brand?: Product["brand"] }> }
  }>(GET_PRODUCTS, {
    variables: {
      filter: { includeInactive: true },
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

  const metadata = parseMetadata(product?.metadata)
  const variantCount = product?.variants?.length ?? 0
  const variants = product?.variants ?? []
  const totalVariantStock =
    variants.reduce((total, variant) => total + (variant.quantity || 0), 0) ?? 0
  const productSummary = product ? compactText(stripHtml(product.summary || product.description)) : ""

  const showIphoneSeminovoRead = !!(
    product &&
    (product.condition === "seminovo" || product.condition === "usado") &&
    looksLikeIphoneProduct({
      title: product.title || "",
      categoryName: product.category?.name,
      categorySlug: product.category?.slug,
      brandName: product.brand?.name,
    })
  )

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

  const handleToggleVisibility = async () => {
    if (!product) return
    const nextCode = productVisibilityToggleCode(product.status?.code)
    const actionLabel = productVisibilityToggleLabel(product.status?.code)
    try {
      await updateProduct({
        variables: {
          id: product.id,
          input: productVisibilityUpdateInput(product, nextCode),
        },
      })
      await refetch()
      showToast.success(
        nextCode === "ACTIVE" ? "Produto publicado" : "Produto em rascunho",
        `"${product.title}" foi marcado como ${productVisibilityLabel(nextCode).toLowerCase()}.`,
      )
    } catch (err: unknown) {
      console.error("Error toggling product visibility:", err)
      showToast.error(
        `Erro ao ${actionLabel.toLowerCase()}`,
        err instanceof Error ? err.message : "Tente novamente.",
      )
    }
  }

  if (loading) {
    return (
      <>
        <DashboardHeader items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Produtos", href: "/dashboard/products" }, { label: "..." }]} />
        <div className="flex flex-col gap-4 p-6">
          <Skeleton className="h-10 w-72" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
          </div>
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </>
    )
  }

  if (error || !product) {
    return (
      <>
        <DashboardHeader items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Produtos", href: "/dashboard/products" }, { label: "Detalhe" }]} />
        <div className="flex min-h-[400px] flex-col items-center justify-center p-4">
          <div className="max-w-md space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg border border-border/80 bg-muted/40">
              <Package className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {error ? "Erro ao carregar produto" : "Produto não encontrado"}
              </h2>
              {error && (
                <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/products")}>
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
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
      <div className="flex flex-1 flex-col bg-background">
        <div className="flex-1 overflow-auto">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-5 py-6 md:px-6">
            <div className="animate-enter flex flex-col gap-4 rounded-lg border border-border/80 bg-card p-4 shadow-none md:flex-row md:items-start md:justify-between">
              <div className="min-w-0 space-y-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-2 h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => router.push("/dashboard/products")}
                >
                  <ArrowLeft className="mr-1 h-3 w-3" />
                  Produtos
                </Button>
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="min-w-0 text-xl font-semibold md:text-2xl">
                      {product.title}
                    </h1>
                    {isProductDraft(product.status?.code) ? (
                      <Badge variant="outline" className="text-xs text-amber-700 border-amber-500/40 bg-amber-50">
                        {productVisibilityLabel(product.status?.code)}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        {productVisibilityLabel(product.status?.code)}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {product.brand ? <span>{product.brand.name}</span> : null}
                    {product.category ? <span>{product.category.name}</span> : null}
                    {product.condition ? <span>{product.condition}</span> : null}
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Button
                  variant={isProductDraft(product.status?.code) ? "default" : "outline"}
                  size="sm"
                  onClick={handleToggleVisibility}
                  disabled={updatingVisibility}
                >
                  {updatingVisibility ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : isProductDraft(product.status?.code) ? (
                    <Globe className="mr-1.5 h-3.5 w-3.5" />
                  ) : (
                    <EyeOff className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  {productVisibilityToggleLabel(product.status?.code)}
                </Button>
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

            <div className="grid gap-5 lg:grid-cols-[minmax(280px,380px)_minmax(0,1fr)]">
              <section className="animate-enter-delay-1 rounded-lg border border-border/80 bg-card shadow-none">
                <div className="border-b border-border/80 bg-muted/25 px-4 py-3">
                  <h2 className="text-sm font-medium">Produto</h2>
                </div>
                <ProductGalleryUpload
                  productId={productId}
                  primaryImage={product.image}
                  metadata={product.metadata}
                  brandSlug={product.brand?.slug}
                  onSaved={() => void refetch()}
                />

                <div className="space-y-4 px-4 pb-4">
                  {productSummary ? (
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {productSummary}
                    </p>
                  ) : null}

                  <div className="grid gap-2">
                    <ProductMetric
                      icon={Tag}
                      label="Preço variantes"
                      value={variantPriceSummary(variants)}
                      tone="bg-blue-50 text-blue-800"
                    />
                    <ProductMetric
                      icon={Layers}
                      label="Variantes"
                      value={variantCount}
                      tone="bg-violet-50 text-violet-800"
                    />
                    <ProductMetric
                      icon={BoxesIcon}
                      label="Stock variantes"
                      value={totalVariantStock}
                      tone="bg-emerald-50 text-emerald-800"
                    />
                    <div className="flex min-h-16 min-w-0 items-center justify-between gap-3 rounded-md border border-border/75 bg-muted/20 px-3 py-2.5">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/60 bg-amber-50 text-amber-800">
                          <Warehouse className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] text-muted-foreground">Stock produto</p>
                          <p className="truncate text-sm font-semibold tabular-nums">
                            {product.stock?.quantity ?? 0}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setStockModalOpen(true)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </section>

              <section className="animate-enter-delay-1 rounded-lg border border-border/80 bg-card shadow-none">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 bg-muted/25 px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border/60 bg-blue-50">
                      <Settings className="h-4 w-4 text-blue-800" />
                    </div>
                    <div>
                      <h2 className="text-sm font-medium">Variantes</h2>
                      <p className="text-[11px] text-muted-foreground">
                        {variantCount} registada{variantCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => setVariantManagerOpen(true)} size="sm">
                    <Settings className="mr-1.5 h-3.5 w-3.5" />
                    Gerir
                  </Button>
                </div>

                {variants.length > 0 ? (
                  <div className="divide-y divide-border">
                    {variants.map((variant) => (
                      <VariantRow
                        key={variant.id}
                        variant={variant}
                        showIphoneSeminovoRead={showIphoneSeminovoRead}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-border/80 bg-muted/40">
                      <Package className="h-7 w-7 text-muted-foreground/40" />
                    </div>
                    <h3 className="mb-1 text-sm font-bold">Nenhuma variante</h3>
                    <p className="mb-4 max-w-[260px] text-xs text-muted-foreground">
                      Adicione variantes para definir preço, stock e atributos.
                    </p>
                    <Button size="sm" onClick={() => setVariantManagerOpen(true)}>
                      <Settings className="mr-1.5 h-3.5 w-3.5" />
                      Gerir variantes
                    </Button>
                  </div>
                )}
              </section>
            </div>

            <Collapsible
              open={advancedOpen}
              onOpenChange={setAdvancedOpen}
              className="animate-enter-delay-2"
            >
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-auto w-full justify-between gap-3 px-4 py-3 text-left"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">Outros detalhes</span>
                      <span className="block truncate text-[11px] font-normal text-muted-foreground">
                        Dados internos, opções da loja e Meta Catalog
                      </span>
                    </span>
                  </span>
                  <ChevronDown
                    className={cn("h-4 w-4 transition-transform", advancedOpen && "rotate-180")}
                  />
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="grid gap-5 pt-5 lg:grid-cols-[minmax(280px,380px)_minmax(0,1fr)]">
                  <div className="space-y-5">
                    <ProductInfoPanel
                      product={product}
                      metadata={metadata}
                      showIphoneSeminovoRead={showIphoneSeminovoRead}
                      variantCount={variantCount}
                    />
                  </div>

                  <div className="space-y-5">
                    <ProductOptionCatalogPanel
                      product={product}
                      variants={variants}
                      onSynced={() => void refetch()}
                    />

                    <MetaCatalogPreview product={product} />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
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
