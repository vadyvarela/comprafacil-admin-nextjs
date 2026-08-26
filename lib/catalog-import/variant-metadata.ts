import type { CatalogSeedProduct, CatalogSeedVariant } from "./types"
import { productOfferToMetadata } from "@/lib/products/product-offer"

/** Rótulo do selector na loja quando só existe o eixo «title» por variante. */
const DEFAULT_OPTION_TITLE = "Modelo"

/**
 * Metadata extra da variante a partir do seed (galeria, bateria, ofertas, etc.).
 */
export function seedVariantMetadataExtras(
  variant: CatalogSeedVariant,
): Record<string, unknown> {
  const extra: Record<string, unknown> = {}

  if (variant.image?.trim()) extra.image = variant.image.trim()
  if (Array.isArray(variant.images) && variant.images.length > 0) {
    extra.images = variant.images.map((u) => u.trim()).filter(Boolean)
  }
  if (variant.hoverImageUrl?.trim()) extra.hoverImageUrl = variant.hoverImageUrl.trim()
  if (variant.semFaceId === true) extra.semFaceId = true
  if (
    variant.batteryHealthPercent !== undefined &&
    variant.batteryHealthPercent !== null &&
    Number.isFinite(variant.batteryHealthPercent)
  ) {
    extra.batteryHealthPercent = variant.batteryHealthPercent
  }
  if (variant.discount !== undefined && variant.discount !== null && variant.discount > 0) {
    extra.discount = variant.discount
  }
  if (
    variant.originalPrice !== undefined &&
    variant.originalPrice !== null &&
    variant.originalPrice > 0
  ) {
    extra.originalPrice = variant.originalPrice
  }
  if (variant.productOffer) {
    const offer = productOfferToMetadata({
      enabled: variant.productOffer.enabled === true,
      title: variant.productOffer.title ?? "Pack de proteção",
      items: variant.productOffer.items ?? [],
    })
    if (offer) extra.productOffer = offer
  }

  return extra
}

/** Metadata completo da variante para o GTW. */
export function buildSeedVariantMetadata(
  product: CatalogSeedProduct,
  variant: CatalogSeedVariant,
): Record<string, unknown> {
  const attrs = seedVariantAttributes(product, variant)
  const meta: Record<string, unknown> = { attributes: attrs, ...seedVariantMetadataExtras(variant) }
  if (variant.sku?.trim()) meta.sku = variant.sku.trim()
  return meta
}

/**
 * Atributos enviados no metadata da variante (GTW), consumidos pela loja em
 * `variantMetadata.attributes` → `AttributeSelector`.
 */
export function seedVariantAttributes(
  product: CatalogSeedProduct,
  variant: CatalogSeedVariant
): Record<string, string> {
  const raw = variant.attributes
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const attrs: Record<string, string> = {}
    for (const [k, val] of Object.entries(raw)) {
      const ks = k.trim()
      const vs = String(val).trim()
      if (ks && vs) attrs[ks] = vs
    }
    if (Object.keys(attrs).length === 0) {
      throw new Error("«attributes» não pode estar vazio")
    }
    return attrs
  }
  const key = (product.variantOptionTitle?.trim() || DEFAULT_OPTION_TITLE).trim() || DEFAULT_OPTION_TITLE
  const label = (variant.title ?? "").trim()
  if (!label) throw new Error("«title» obrigatório quando não há «attributes»")
  return { [key]: label }
}

export function variantTitleFromAttributes(attrs: Record<string, string>): string {
  return Object.values(attrs).join(" / ")
}

/** Lista para metadata do produto (opcional), alinhada ao formato da loja. */
export function productOptionCatalogFromVariants(
  product: CatalogSeedProduct
): Array<{ name: string; values: string[] }> {
  const perVariant = product.variants.map((v) => seedVariantAttributes(product, v))
  const keyOrder = Object.keys(perVariant[0] ?? {})
  if (!keyOrder.length) return []
  const out: Array<{ name: string; values: string[] }> = []
  for (const name of keyOrder) {
    const seen = new Set<string>()
    const values: string[] = []
    for (const a of perVariant) {
      const val = a[name]
      if (val && !seen.has(val)) {
        seen.add(val)
        values.push(val)
      }
    }
    out.push({ name, values })
  }
  return out
}
