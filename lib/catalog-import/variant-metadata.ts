import type { CatalogSeedProduct, CatalogSeedVariant } from "./types"

/** Rótulo do selector na loja quando só existe o eixo «title» por variante. */
const DEFAULT_OPTION_TITLE = "Modelo"

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
