export type MetaCatalogMetadataInput = {
  googleProductCategory: string
  productType: string
  color: string
  size: string
  salePriceEffectiveDate: string
}

export const EMPTY_META_CATALOG_METADATA: MetaCatalogMetadataInput = {
  googleProductCategory: "",
  productType: "",
  color: "",
  size: "",
  salePriceEffectiveDate: "",
}

type MetadataRecord = Record<string, unknown>

function parseMetadataBase(metadataJson?: string | null): MetadataRecord {
  if (!metadataJson) return {}
  try {
    const parsed = JSON.parse(metadataJson) as unknown
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as MetadataRecord)
      : {}
  } catch {
    return {}
  }
}

function asText(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function firstText(...values: unknown[]): string {
  for (const value of values) {
    const text = asText(value)
    if (text) return text
  }
  return ""
}

function writeText(
  target: MetadataRecord,
  key: string,
  aliases: string[],
  value: string,
) {
  const text = value.trim()
  for (const alias of aliases) delete target[alias]
  if (text) target[key] = text
  else delete target[key]
}

export function parseMetaCatalogMetadata(
  metadataJson?: string | null,
): MetaCatalogMetadataInput {
  const metadata = parseMetadataBase(metadataJson)
  return {
    googleProductCategory: firstText(
      metadata.google_product_category,
      metadata.googleProductCategory,
    ),
    productType: firstText(metadata.product_type, metadata.productType),
    color: firstText(metadata.color),
    size: firstText(metadata.size),
    salePriceEffectiveDate: firstText(
      metadata.sale_price_effective_date,
      metadata.salePriceEffectiveDate,
    ),
  }
}

export function applyMetaCatalogMetadata(
  base: MetadataRecord,
  input: MetaCatalogMetadataInput,
): MetadataRecord {
  const next = { ...base }
  writeText(next, "google_product_category", ["googleProductCategory"], input.googleProductCategory)
  writeText(next, "product_type", ["productType"], input.productType)
  writeText(next, "color", [], input.color)
  writeText(next, "size", [], input.size)
  writeText(
    next,
    "sale_price_effective_date",
    ["salePriceEffectiveDate"],
    input.salePriceEffectiveDate,
  )
  return next
}

export function mergeMetaCatalogMetadataJson(
  metadataJson: string | null | undefined,
  input: MetaCatalogMetadataInput,
): string | null {
  const next = applyMetaCatalogMetadata(parseMetadataBase(metadataJson), input)
  return Object.keys(next).length > 0 ? JSON.stringify(next) : null
}

export function hasMetaCatalogMetadata(input: MetaCatalogMetadataInput): boolean {
  return Object.values(input).some((value) => value.trim().length > 0)
}
