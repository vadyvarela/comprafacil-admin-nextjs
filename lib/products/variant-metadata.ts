import {
  parseHoverImageUrl,
  parseProductGalleryUrls,
} from "@/lib/products/product-gallery-metadata"
import {
  applyMetaCatalogMetadata,
  EMPTY_META_CATALOG_METADATA,
  parseMetaCatalogMetadata,
  type MetaCatalogMetadataInput,
} from "@/lib/products/meta-catalog-metadata"
import {
  parseProductOffer,
  productOfferToMetadata,
  type ProductOffer,
} from "@/lib/products/product-offer"
import { normalizeBatteryHealthPercent } from "@/lib/utils/iphone-seminovo-metadata"

export type ParsedVariantMetadata = {
  attributes: Record<string, string>
  sku?: string
  image?: string
  images: string[]
  hoverImageUrl?: string | null
  semFaceId?: boolean
  batteryHealthPercent?: number | null
  productOffer?: ProductOffer | null
  discount?: number | null
  originalPrice?: number | null
  metaCatalog: MetaCatalogMetadataInput
}

export type VariantMetadataInput = {
  attributes: Record<string, string>
  sku?: string
  image?: string
  images?: string[]
  hoverImageUrl?: string | null
  semFaceId?: boolean
  batteryHealthPercent?: string
  offerEnabled?: boolean
  offerTitle?: string
  offerItems?: string[]
  discount?: string
  originalPrice?: string
  metaCatalog?: MetaCatalogMetadataInput
}

function parseMetadataBase(metadataJson?: string | null): Record<string, unknown> {
  if (!metadataJson) return {}
  try {
    return JSON.parse(metadataJson) as Record<string, unknown>
  } catch {
    return {}
  }
}

function parseOptionalNumber(raw: unknown): number | null {
  if (raw === undefined || raw === null || raw === "") return null
  const n = typeof raw === "number" ? raw : parseFloat(String(raw))
  return Number.isFinite(n) ? n : null
}

function parseOptionalDiscount(raw: unknown): number | null {
  const n = parseOptionalNumber(raw)
  if (n === null || n < 0 || n > 100) return null
  return Math.round(n)
}

/** Parse metadata JSON de uma variante para objeto tipado. */
export function parseVariantMetadata(
  primaryImage?: string | null,
  metadataJson?: string | null,
): ParsedVariantMetadata {
  const base = parseMetadataBase(metadataJson)
  const attributes =
    base.attributes && typeof base.attributes === "object" && !Array.isArray(base.attributes)
      ? (base.attributes as Record<string, string>)
      : {}

  const images = parseProductGalleryUrls(primaryImage, metadataJson)
  const image = images[0] ?? undefined

  let batteryHealthPercent: number | null = null
  if (base.batteryHealthPercent !== undefined && base.batteryHealthPercent !== null) {
    const n = parseOptionalDiscount(base.batteryHealthPercent)
    if (n !== null) batteryHealthPercent = n
  }

  return {
    attributes,
    sku: typeof base.sku === "string" && base.sku.trim() ? base.sku.trim() : undefined,
    image,
    images,
    hoverImageUrl: parseHoverImageUrl(metadataJson),
    semFaceId: base.semFaceId === true,
    batteryHealthPercent,
    productOffer: parseProductOffer(base.productOffer),
    discount: parseOptionalDiscount(base.discount),
    originalPrice: parseOptionalNumber(base.originalPrice),
    metaCatalog: parseMetaCatalogMetadata(metadataJson),
  }
}

/** Constrói metadata JSON a partir dos campos da combinação. */
export function buildVariantMetadataJson(
  existingJson: string | null | undefined,
  input: VariantMetadataInput,
  imageOverride?: string | null,
): string {
  const existing = parseMetadataBase(existingJson)

  const galleryUrls = (input.images ?? []).map((u) => u.trim()).filter(Boolean)
  const resolvedCover =
    imageOverride !== undefined
      ? (imageOverride ?? "").trim()
      : input.image?.trim() || galleryUrls[0] || ""

  const metadata: Record<string, unknown> = {
    ...existing,
    attributes: input.attributes,
  }

  if (input.sku?.trim()) metadata.sku = input.sku.trim()
  else delete metadata.sku

  if (resolvedCover) metadata.image = resolvedCover
  else delete metadata.image

  if (galleryUrls.length > 0) metadata.images = galleryUrls
  else delete metadata.images

  const hover = input.hoverImageUrl?.trim() || null
  if (hover && galleryUrls.includes(hover) && hover !== resolvedCover) {
    metadata.hoverImageUrl = hover
  } else {
    delete metadata.hoverImageUrl
  }

  if (input.semFaceId) metadata.semFaceId = true
  else delete metadata.semFaceId

  const pct = normalizeBatteryHealthPercent(input.batteryHealthPercent ?? "")
  if (pct !== null) metadata.batteryHealthPercent = pct
  else delete metadata.batteryHealthPercent

  const offerMeta = productOfferToMetadata({
    enabled: input.offerEnabled === true,
    title: input.offerTitle ?? "Pack de proteção",
    items: input.offerItems ?? [],
  })
  if (offerMeta) metadata.productOffer = offerMeta
  else delete metadata.productOffer

  const discount = input.discount?.trim()
    ? parseOptionalDiscount(input.discount)
    : null
  if (discount !== null && discount > 0) metadata.discount = discount
  else delete metadata.discount

  const originalPrice = input.originalPrice?.trim()
    ? parseOptionalNumber(input.originalPrice)
    : null
  if (originalPrice !== null && originalPrice > 0) metadata.originalPrice = originalPrice
  else delete metadata.originalPrice

  const withMetaCatalog = applyMetaCatalogMetadata(
    metadata,
    input.metaCatalog ?? EMPTY_META_CATALOG_METADATA,
  )

  return JSON.stringify(withMetaCatalog)
}

/** Extrai campos editáveis a partir de variante existente. */
export function variantMetadataToInput(
  primaryImage?: string | null,
  metadataJson?: string | null,
): Omit<VariantMetadataInput, "attributes"> & { images: string[] } {
  const parsed = parseVariantMetadata(primaryImage, metadataJson)
  const offer = parsed.productOffer
  return {
    sku: parsed.sku,
    image: parsed.image,
    images: parsed.images,
    hoverImageUrl: parsed.hoverImageUrl ?? null,
    semFaceId: parsed.semFaceId === true,
    batteryHealthPercent:
      parsed.batteryHealthPercent !== undefined && parsed.batteryHealthPercent !== null
        ? String(parsed.batteryHealthPercent)
        : "",
    offerEnabled: offer?.enabled === true,
    offerTitle: offer?.title ?? "Pack de proteção",
    offerItems: offer?.items ?? [],
    discount:
      parsed.discount !== undefined && parsed.discount !== null
        ? String(parsed.discount)
        : "",
    originalPrice:
      parsed.originalPrice !== undefined && parsed.originalPrice !== null
        ? String(parsed.originalPrice)
        : "",
    metaCatalog: parsed.metaCatalog,
  }
}
