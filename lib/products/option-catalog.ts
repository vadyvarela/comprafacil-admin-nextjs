import type { ProductVariant } from "@/lib/graphql/products/types"

export type OptionCatalogEntry = { name: string; values: string[] }

function parseVariantAttributes(metadata: string | null | undefined): Record<string, string> {
  if (!metadata) return {}
  try {
    const parsed = JSON.parse(metadata) as { attributes?: Record<string, string> }
    if (
      parsed.attributes &&
      typeof parsed.attributes === "object" &&
      !Array.isArray(parsed.attributes)
    ) {
      const out: Record<string, string> = {}
      for (const [k, v] of Object.entries(parsed.attributes)) {
        const ks = k.trim()
        const vs = String(v).trim()
        if (ks && vs) out[ks] = vs
      }
      return out
    }
  } catch {
    /* ignore */
  }
  return {}
}

export function parseProductOptionCatalog(
  metadataJson: string | null | undefined,
): OptionCatalogEntry[] {
  if (!metadataJson) return []
  try {
    const meta = JSON.parse(metadataJson) as { attributes?: unknown }
    if (!Array.isArray(meta.attributes)) return []
    const out: OptionCatalogEntry[] = []
    for (const item of meta.attributes) {
      if (
        item &&
        typeof item === "object" &&
        typeof (item as OptionCatalogEntry).name === "string" &&
        Array.isArray((item as OptionCatalogEntry).values)
      ) {
        const name = (item as OptionCatalogEntry).name.trim()
        const values = (item as OptionCatalogEntry).values
          .map((v) => String(v).trim())
          .filter(Boolean)
        if (name && values.length > 0) out.push({ name, values })
      }
    }
    return out
  } catch {
    return []
  }
}

/** Catálogo derivado dos atributos das variantes (o que a loja deveria mostrar). */
export function deriveOptionCatalogFromVariants(
  variants: ProductVariant[],
): OptionCatalogEntry[] {
  const perVariant = variants
    .map((v) => {
      const attrs = parseVariantAttributes(v.metadata)
      if (Object.keys(attrs).length > 0) return attrs
      const title = v.title?.trim()
      return title ? { Modelo: title } : {}
    })
    .filter((a) => Object.keys(a).length > 0)

  if (perVariant.length === 0) return []

  const keyOrder = Object.keys(perVariant[0])
  const out: OptionCatalogEntry[] = []
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
    if (values.length > 0) out.push({ name, values })
  }
  return out
}

function normalizeCatalog(catalog: OptionCatalogEntry[]): string {
  return JSON.stringify(
    catalog
      .map((e) => ({
        name: e.name,
        values: [...e.values].sort((a, b) => a.localeCompare(b, "pt")),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "pt")),
  )
}

export function optionCatalogsMatch(a: OptionCatalogEntry[], b: OptionCatalogEntry[]): boolean {
  return normalizeCatalog(a) === normalizeCatalog(b)
}

export function mergeProductMetadataAttributes(
  metadataJson: string | null | undefined,
  catalog: OptionCatalogEntry[],
): string {
  const base: Record<string, unknown> = {}
  try {
    if (metadataJson) Object.assign(base, JSON.parse(metadataJson))
  } catch {
    /* ignore */
  }
  if (catalog.length > 0) {
    base.attributes = catalog
  } else {
    delete base.attributes
  }
  return JSON.stringify(base)
}
