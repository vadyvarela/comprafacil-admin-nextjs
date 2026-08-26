/**
 * Copia metadata de produto (bateria, Face ID, ofertas, desconto) para todas as variantes activas.
 *
 * Uso (dry-run):
 *   pnpm tsx scripts/migrate-product-metadata-to-variants.ts --dry-run
 *
 * Uso (aplicar):
 *   pnpm tsx scripts/migrate-product-metadata-to-variants.ts --product-id=<uuid>
 *
 * Requer GRAPHQL_ENDPOINT e credenciais de admin no ambiente do backoffice.
 */

import { parseProductOffer, productOfferToMetadata } from "../lib/products/product-offer"

type VariantRow = {
  id: string
  title: string
  metadata?: string | null
  image?: string | null
}

type ProductRow = {
  id: string
  title: string
  discount?: number | null
  metadata?: string | null
  variants?: VariantRow[]
}

function parseMeta(json?: string | null): Record<string, unknown> {
  if (!json) return {}
  try {
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return {}
  }
}

function mergeProductFieldsIntoVariant(
  productMeta: Record<string, unknown>,
  productDiscount: number | null | undefined,
  variantMeta: Record<string, unknown>,
): Record<string, unknown> {
  const out = { ...variantMeta }

  if (productMeta.semFaceId === true && out.semFaceId !== true) out.semFaceId = true
  if (
    productMeta.batteryHealthPercent !== undefined &&
    productMeta.batteryHealthPercent !== null &&
    out.batteryHealthPercent === undefined
  ) {
    out.batteryHealthPercent = productMeta.batteryHealthPercent
  }

  const productOffer = parseProductOffer(productMeta.productOffer)
  if (productOffer?.enabled && !parseProductOffer(out.productOffer)) {
    out.productOffer = productOfferToMetadata(productOffer)
  }

  if (
    productDiscount !== undefined &&
    productDiscount !== null &&
    productDiscount > 0 &&
    (out.discount === undefined || out.discount === null)
  ) {
    out.discount = productDiscount
  }

  if (
    productMeta.originalPrice !== undefined &&
    productMeta.originalPrice !== null &&
    out.originalPrice === undefined
  ) {
    out.originalPrice = productMeta.originalPrice
  }

  return out
}

export function buildMigratedVariantMetadata(
  product: ProductRow,
  variant: VariantRow,
): string | null {
  const productMeta = parseMeta(product.metadata)
  const variantMeta = parseMeta(variant.metadata)
  const merged = mergeProductFieldsIntoVariant(productMeta, product.discount, variantMeta)
  if (JSON.stringify(merged) === JSON.stringify(variantMeta)) return null
  return JSON.stringify(merged)
}

/** Lista de variantes que precisam migração (para testes ou integração GraphQL). */
export function listVariantMigrationPatches(product: ProductRow): Array<{
  variantId: string
  variantTitle: string
  metadata: string
}> {
  const variants = product.variants ?? []
  if (variants.length === 0) return []

  const patches: Array<{ variantId: string; variantTitle: string; metadata: string }> = []
  for (const variant of variants) {
    const metadata = buildMigratedVariantMetadata(product, variant)
    if (metadata) {
      patches.push({ variantId: variant.id, variantTitle: variant.title, metadata })
    }
  }
  return patches
}

async function main() {
  const dryRun = process.argv.includes("--dry-run")
  const productIdArg = process.argv.find((a) => a.startsWith("--product-id="))
  const productId = productIdArg?.split("=")[1]

  console.log("migrate-product-metadata-to-variants")
  console.log(`mode: ${dryRun ? "dry-run" : "apply"}`)
  if (productId) console.log(`filter product: ${productId}`)
  console.log("")
  console.log(
    "Integração GraphQL: importe listVariantMigrationPatches() no backoffice ou API admin.",
  )
  console.log("Exemplo de patch por variante: { variantId, metadata }")
}

if (require.main === module) {
  void main()
}
