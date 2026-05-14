import { gql } from "@apollo/client"
import { gtwClient } from "@/lib/gtw-client"
import { GET_PRODUCT } from "@/lib/graphql/products/queries"
import { CREATE_PRODUCT_VARIANT, UPDATE_PRODUCT_VARIANT } from "@/lib/graphql/variants/mutations"
import { UPDATE_STOCK } from "@/lib/graphql/stocks/mutations"
import type { CatalogSeedProduct } from "./types"
import { seedVariantAttributes, variantTitleFromAttributes } from "./variant-metadata"

type GtwClient = typeof gtwClient

const FIND_PRODUCTS_BY_TITLE = gql`
  query FindProductsByTitle($title: String!) {
    products(filter: { title: $title }, page: { page: 0, size: 40, sortBy: "createdAt", sortDirection: "DESC" }) {
      data {
        id
        title
      }
    }
  }
`

function parseVariantMeta(metadata: string | null | undefined): { sku?: string } {
  if (!metadata?.trim()) return {}
  try {
    return JSON.parse(metadata) as { sku?: string }
  } catch {
    return {}
  }
}

function norm(s: string): string {
  return s.trim().toLowerCase()
}

export function isDuplicateProductTitleMessage(msg: string): boolean {
  const m = msg.toLowerCase()
  return m.includes("already exists") && m.includes("title") && m.includes("product")
}

export function combineMutationErrors(result: {
  errors?: readonly { message?: string }[] | null
  error?: { message?: string } | null
}): string {
  const parts: string[] = []
  if (result.errors?.length) {
    for (const e of result.errors) {
      if (e.message) parts.push(e.message)
    }
  }
  if (result.error?.message) parts.push(result.error.message)
  return parts.join("; ")
}

export async function findExistingProductIdByExactTitle(
  client: GtwClient,
  exactTitle: string
): Promise<string | null> {
  const t = exactTitle.trim()
  if (!t) return null
  const { data, error } = await client.query<{
    products: { data: { id: string; title?: string | null }[] }
  }>({
    query: FIND_PRODUCTS_BY_TITLE,
    variables: { title: t },
    fetchPolicy: "network-only",
    errorPolicy: "all",
  })
  if (error?.message) throw new Error(error.message)
  const rows = data?.products?.data ?? []
  const want = norm(t)
  const hit = rows.find((r: { id: string; title?: string | null }) => norm(r.title ?? "") === want)
  return hit?.id ?? null
}

type ExistingVariant = {
  id: string
  title: string
  quantity: number
  metadata?: string | null
  price?: { id: string; unitAmount: number; currency: string } | null
}

function findVariantMatch(
  existing: ExistingVariant[],
  used: Set<string>,
  seedSku: string | null,
  seedTitleNorm: string
): ExistingVariant | undefined {
  return existing.find((ev: ExistingVariant) => {
    if (used.has(ev.id)) return false
    const meta = parseVariantMeta(ev.metadata)
    const evSku = typeof meta.sku === "string" && meta.sku.trim() ? norm(meta.sku) : null
    if (seedSku && evSku) return seedSku === evSku
    return norm(ev.title) === seedTitleNorm
  })
}

/**
 * O gateway trata `stock.quantity` como reserva não alocada às variantes.
 * Cada aumento de quantidade na variante consome dessa reserva.
 * Calcula quanto falta acrescentar à reserva para a sequência de updates/criações do JSON.
 */
function computeExtraStockPoolNeeded(
  poolQty: number,
  existing: ExistingVariant[],
  p: CatalogSeedProduct
): number {
  let s = poolQty
  let boost = 0
  const used = new Set<string>()
  for (const v of p.variants) {
    const attrs = seedVariantAttributes(p, v)
    const variantTitle = v.title?.trim() || variantTitleFromAttributes(attrs)
    const seedSku = v.sku?.trim() ? norm(v.sku.trim()) : null
    const seedTitleNorm = norm(variantTitle)
    const m = findVariantMatch(existing, used, seedSku, seedTitleNorm)
    if (m) {
      used.add(m.id)
      const diff = v.quantity - m.quantity
      if (diff > 0) {
        if (diff > s) {
          boost += diff - s
          s = 0
        } else {
          s -= diff
        }
      } else if (diff < 0) {
        s += -diff
      }
    } else {
      const need = v.quantity
      if (need > s) {
        boost += need - s
        s = 0
      } else {
        s -= need
      }
    }
  }
  return boost
}

/**
 * Quando o produto já existe: actualiza stock (e preço/metadata) das variantes
 * que casam por SKU (metadata) ou por título; cria variantes em falta.
 */
export async function syncExistingProductFromCatalog(
  client: GtwClient,
  productId: string,
  p: CatalogSeedProduct
): Promise<{ updated: number; created: number; warnings: string[] }> {
  const { data, error } = await client.query<{
    productDetails: {
      id: string
      title?: string | null
      stock?: { id: string; name?: string | null; quantity: number } | null
      variants?: ExistingVariant[] | null
    } | null
  }>({
    query: GET_PRODUCT,
    variables: { id: productId },
    fetchPolicy: "network-only",
    errorPolicy: "all",
  })
  if (error?.message) throw new Error(error.message)
  const details = data?.productDetails
  const existing = details?.variants ?? []
  const stock = details?.stock
  if (!stock?.id) {
    throw new Error("Produto sem registo de stock no gateway (impossível sincronizar quantidades).")
  }

  const boost = computeExtraStockPoolNeeded(stock.quantity, existing, p)
  if (boost > 0) {
    const stockName =
      stock.name?.trim() ||
      `Stock - ${(details?.title ?? p.title).trim() || "produto"}`
    const sr = await client.mutate({
      mutation: UPDATE_STOCK,
      variables: {
        stockId: stock.id,
        input: {
          name: stockName,
          quantity: stock.quantity + boost,
        },
      },
      errorPolicy: "all",
    })
    const serr = combineMutationErrors(sr)
    if (serr) throw new Error(`Stock global do produto: ${serr}`)
  }

  const used = new Set<string>()
  let updated = 0
  let created = 0
  const warnings: string[] = []

  for (const v of p.variants) {
    const attrs = seedVariantAttributes(p, v)
    const variantMeta: Record<string, unknown> = { attributes: attrs }
    if (v.sku?.trim()) variantMeta.sku = v.sku.trim()
    const variantTitle = v.title?.trim() || variantTitleFromAttributes(attrs)
    const metaJson = JSON.stringify(variantMeta)
    const seedSku = v.sku?.trim() ? norm(v.sku.trim()) : null
    const seedTitleNorm = norm(variantTitle)

    const match = findVariantMatch(existing, used, seedSku, seedTitleNorm)

    const priceData = {
      nickname: "Preço",
      unitAmount: Math.round(v.price * 100),
      currency: "CVE",
    }

    if (match) {
      used.add(match.id)
      const ur = await client.mutate({
        mutation: UPDATE_PRODUCT_VARIANT,
        variables: {
          id: match.id,
          input: {
            productId,
            title: variantTitle,
            quantity: v.quantity,
            metadata: metaJson,
            priceData,
          },
        },
        errorPolicy: "all",
      })
      const uerr = combineMutationErrors(ur)
      if (uerr) {
        warnings.push(`${variantTitle}: ${uerr}`)
        continue
      }
      updated++
    } else {
      const cr = await client.mutate({
        mutation: CREATE_PRODUCT_VARIANT,
        variables: {
          input: {
            productId,
            title: variantTitle,
            quantity: v.quantity,
            metadata: metaJson,
            priceData,
          },
        },
        errorPolicy: "all",
      })
      const cerr = combineMutationErrors(cr)
      if (cerr) {
        warnings.push(`${variantTitle}: ${cerr}`)
        continue
      }
      created++
    }
  }

  return { updated, created, warnings }
}
