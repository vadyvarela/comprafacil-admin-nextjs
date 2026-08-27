"use client"

import { AlertCircle, CheckCircle2, Copy, ExternalLink, Megaphone } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Product, ProductVariant } from "@/lib/graphql/products/types"
import {
  parseMetaCatalogMetadata,
  type MetaCatalogMetadataInput,
} from "@/lib/products/meta-catalog-metadata"
import { parseVariantMetadata } from "@/lib/products/variant-metadata"
import { showToast } from "@/lib/utils/toast"

const META_COLUMNS = [
  "id",
  "title",
  "description",
  "availability",
  "condition",
  "price",
  "link",
  "image_link",
  "brand",
  "additional_image_link",
  "google_product_category",
  "product_type",
  "sale_price",
  "sale_price_effective_date",
  "item_group_id",
  "color",
  "size",
] as const

type MetaColumn = (typeof META_COLUMNS)[number]
type MetaPreviewRow = Record<MetaColumn, string> & {
  included: boolean
  reasons: string[]
}

type ParsedVariantMetadata = ReturnType<typeof parseVariantMetadata>

function storeOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_TECHARENA_URL?.trim() ||
    process.env.NEXT_PUBLIC_STORE_URL?.trim() ||
    "https://kumprafacil.cv"
  ).replace(/\/$/, "")
}

function csvEscape(value: string): string {
  const clean = value.replace(/\r?\n|\r/g, " ").trim()
  if (!/[",\n]/.test(clean)) return clean
  return `"${clean.replace(/"/g, '""')}"`
}

function csvLine(row: Record<MetaColumn, string>): string {
  return META_COLUMNS.map((column) => csvEscape(row[column])).join(",")
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

function productSlug(product: Product): string {
  return slugify(product.title || product.id) || product.id
}

function variantSuffix(
  productTitle: string,
  variant: ProductVariant,
  parsed: ParsedVariantMetadata,
): string {
  const entries = Object.entries(parsed.attributes)
    .map(([key, value]) => [key.trim(), String(value).trim()] as const)
    .filter(([, value]) => value.length > 0)

  if (entries.length > 0) {
    const values = entries.map(([, value]) => value)
    const joined = values.join(" - ")
    return joined === productTitle ? "" : joined
  }

  const title = variant.title?.trim() || ""
  return title && title !== productTitle ? title.replace(/\s*\/\s*/g, " - ") : ""
}

function variantPathSlug(
  product: Product,
  variant: ProductVariant,
  parsed: ParsedVariantMetadata,
): string {
  const raw = variantSuffix(product.title, variant, parsed) || variant.title || variant.id
  return slugify(raw) || variant.id.replace(/-/g, "").slice(0, 8)
}

function productUrl(
  origin: string,
  product: Product,
  variant?: ProductVariant,
  parsed?: ParsedVariantMetadata,
  variantCount = 0,
): string {
  const variantSegment =
    variant && parsed && variantCount > 1 ? `/${variantPathSlug(product, variant, parsed)}` : ""
  return `${origin}/produto/${productSlug(product)}${variantSegment}`
}

function stripHtml(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function metaPrice(value: number): string {
  const amount = Math.round(value * 100) / 100
  return `${Number.isInteger(amount) ? String(amount) : amount.toFixed(2)} CVE`
}

function mergeMetaCatalog(
  productMeta: MetaCatalogMetadataInput,
  variantMeta?: MetaCatalogMetadataInput,
  parsed?: ParsedVariantMetadata,
  categoryName?: string | null,
  categorySlug?: string | null,
): MetaCatalogMetadataInput {
  const attributes = parsed?.attributes ?? {}
  const attr = (names: string[]) => {
    for (const [key, value] of Object.entries(attributes)) {
      const normalized = slugify(key)
      if (names.includes(normalized) && String(value).trim()) return String(value).trim()
    }
    return ""
  }

  return {
    googleProductCategory:
      variantMeta?.googleProductCategory || productMeta.googleProductCategory,
    productType:
      variantMeta?.productType || productMeta.productType || categoryName || categorySlug || "",
    color: variantMeta?.color || productMeta.color || attr(["cor", "color"]),
    size:
      variantMeta?.size ||
      productMeta.size ||
      attr(["tamanho", "size", "capacidade"]),
    salePriceEffectiveDate:
      variantMeta?.salePriceEffectiveDate || productMeta.salePriceEffectiveDate,
  }
}

function resolveImage(
  origin: string,
  product: Product,
  variant?: ProductVariant,
  parsed?: ParsedVariantMetadata,
): string {
  const raw = parsed?.image || variant?.image || product.image || ""
  if (!raw.trim()) return ""
  try {
    const url = new URL(raw, origin)
    return url.toString()
  } catch {
    return raw
  }
}

function resolvePricing(
  product: Product,
  variant?: ProductVariant,
  parsed?: ParsedVariantMetadata,
): { price: string; salePrice: string; hasPrice: boolean } {
  const current = variant?.price?.unitAmount ? variant.price.unitAmount / 100 : 0
  if (!current || current <= 0) return { price: "", salePrice: "", hasPrice: false }

  const discount = parsed?.discount ?? product.discount ?? 0
  const original = parsed?.originalPrice && parsed.originalPrice > current
    ? parsed.originalPrice
    : current

  if (discount > 0 && discount <= 100 && original > 0) {
    return {
      price: metaPrice(original),
      salePrice: metaPrice(original * (1 - discount / 100)),
      hasPrice: true,
    }
  }

  return { price: metaPrice(current), salePrice: "", hasPrice: true }
}

function buildRows(product: Product): MetaPreviewRow[] {
  const origin = storeOrigin()
  const productMeta = parseMetaCatalogMetadata(product.metadata)
  const variants = product.variants ?? []
  const active = product.status?.code === "ACTIVE"
  const sourceRows = variants.length > 0 ? variants : [null]

  return sourceRows.map((variant) => {
    const parsed = variant ? parseVariantMetadata(variant.image, variant.metadata) : undefined
    const variantMeta = variant ? parseMetaCatalogMetadata(variant.metadata) : undefined
    const meta = mergeMetaCatalog(
      productMeta,
      variantMeta,
      parsed,
      product.category?.name,
      product.category?.slug,
    )
    const titleSuffix = variant && parsed && variants.length > 1
      ? variantSuffix(product.title, variant, parsed)
      : ""
    const title = titleSuffix ? `${product.title} (${titleSuffix})` : product.title
    const image = resolveImage(origin, product, variant ?? undefined, parsed)
    const pricing = resolvePricing(product, variant ?? undefined, parsed)
    const quantity = variant ? variant.quantity || 0 : product.stock?.quantity || 0
    const imageIsValid = image.startsWith("https://")
    const reasons: string[] = []

    if (!active) reasons.push("produto em rascunho")
    if (quantity <= 0) reasons.push("sem stock")
    if (!pricing.hasPrice) reasons.push("sem preço")
    if (!image) reasons.push("sem imagem")
    else if (!imageIsValid) reasons.push("imagem sem HTTPS")

    return {
      id: variant?.id || product.id,
      title,
      description:
        stripHtml(product.summary || product.description || "") ||
        `Compre ${title} na KumpraFacil.`,
      availability: active && quantity > 0 ? "in stock" : "out of stock",
      condition:
        product.condition === "seminovo" || product.condition === "usado" ? "used" : "new",
      price: pricing.price,
      link: productUrl(origin, product, variant ?? undefined, parsed, variants.length),
      image_link: image,
      brand: product.brand?.name || "KumpraFacil",
      additional_image_link: "",
      google_product_category: meta.googleProductCategory,
      product_type: meta.productType,
      sale_price: pricing.salePrice,
      sale_price_effective_date: meta.salePriceEffectiveDate,
      item_group_id: variant ? product.id : "",
      color: meta.color,
      size: meta.size,
      included: reasons.length === 0,
      reasons,
    }
  })
}

export function MetaCatalogPreview({ product }: { product: Product }) {
  const rows = buildRows(product)
  const includedCount = rows.filter((row) => row.included).length
  const csvPreview = [META_COLUMNS.join(","), ...rows.slice(0, 5).map(csvLine)].join("\n")

  async function copyPreview() {
    try {
      await navigator.clipboard.writeText(csvPreview)
      showToast.success("Preview copiado", "Amostra CSV copiada para o clipboard.")
    } catch {
      showToast.error("Não foi possível copiar", "Copia manualmente a partir do preview.")
    }
  }

  return (
    <div className="rounded-lg border border-border/80 bg-card shadow-none">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 bg-muted/25 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border/60 bg-blue-50">
            <Megaphone className="h-4 w-4 text-blue-800" aria-hidden />
          </div>
          <div>
            <h2 className="text-sm font-medium">Meta Catalog</h2>
            <p className="text-[11px] text-muted-foreground">
              {includedCount}/{rows.length} linha{rows.length !== 1 ? "s" : ""} pronta
            </p>
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={copyPreview}>
          <Copy className="h-3.5 w-3.5" aria-hidden />
          Copiar preview
        </Button>
      </div>

      <div className="space-y-3 p-4">
        <div className="overflow-x-auto rounded-md border border-border/70">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="border-b border-border/70 bg-muted/30 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Estado</th>
                <th className="px-3 py-2 font-medium">ID</th>
                <th className="px-3 py-2 font-medium">Título</th>
                <th className="px-3 py-2 font-medium">Preço</th>
                <th className="px-3 py-2 font-medium">Sale</th>
                <th className="px-3 py-2 font-medium">Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-3 py-2">
                    {row.included ? (
                      <Badge variant="secondary" className="gap-1 text-[10px]">
                        <CheckCircle2 className="h-3 w-3" aria-hidden />
                        No feed
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-[10px] text-amber-800">
                        <AlertCircle className="h-3 w-3" aria-hidden />
                        Fora
                      </Badge>
                    )}
                    {row.reasons.length > 0 ? (
                      <p className="mt-1 max-w-[150px] text-[10px] text-muted-foreground">
                        {row.reasons.join(", ")}
                      </p>
                    ) : null}
                  </td>
                  <td className="max-w-[160px] truncate px-3 py-2 font-mono text-[11px]">
                    {row.id}
                  </td>
                  <td className="max-w-[220px] truncate px-3 py-2">{row.title}</td>
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-[11px]">
                    {row.price || "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-[11px]">
                    {row.sale_price || "—"}
                  </td>
                  <td className="max-w-[220px] truncate px-3 py-2">
                    <a
                      href={row.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex max-w-full items-center gap-1 text-primary hover:underline"
                    >
                      <span className="truncate">{row.link}</span>
                      <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <pre className="max-h-36 overflow-auto rounded-md border border-border/70 bg-muted/20 p-3 text-[10px] leading-relaxed text-muted-foreground">
          {csvPreview}
        </pre>
      </div>
    </div>
  )
}
