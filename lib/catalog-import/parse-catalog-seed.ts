import type {
  CatalogImportRowIssue,
  CatalogResolvedIds,
  CatalogSeedFile,
  CatalogSeedProduct,
} from "./types"
import { seedVariantAttributes } from "./variant-metadata"

/** Normaliza texto de referência (slug ou nome vindo do JSON). */
export function normalizeCatalogRef(s: string): string {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

/** Gera variantes comuns (singular/plural) para casar com slugs na BD (ex.: smartphone ↔ smartphones). */
function refMatchCandidates(hint: string): string[] {
  const base = normalizeCatalogRef(hint)
  if (!base) return []
  const out: string[] = []
  const push = (x: string) => {
    if (x && !out.includes(x)) out.push(x)
  }
  push(base)
  if (base.endsWith("s") && base.length > 2) {
    push(base.slice(0, -1))
    if (base.endsWith("es") && base.length > 3) push(base.slice(0, -2))
  } else {
    push(`${base}s`)
    push(`${base}es`)
  }
  return out
}

export function getCategoryHint(p: CatalogSeedProduct): string {
  return (p.categorySlug ?? p.categoryName ?? "").trim()
}

export function getBrandHint(p: CatalogSeedProduct): string {
  return (p.brandSlug ?? p.brandName ?? "").trim()
}

function matchEntityId(
  hint: string,
  list: { id: string; name: string; slug: string }[]
): string | null {
  const candidates = refMatchCandidates(hint)
  if (!candidates.length) return null
  for (const q of candidates) {
    const bySlug = list.find((x) => normalizeCatalogRef(x.slug ?? "") === q)
    if (bySlug) return bySlug.id
  }
  for (const q of candidates) {
    const byName = list.find((x) => normalizeCatalogRef(x.name) === q)
    if (byName) return byName.id
  }
  return null
}

export function resolveProductRefs(
  p: CatalogSeedProduct,
  categories: { id: string; name: string; slug: string }[],
  brands: { id: string; name: string; slug: string }[]
): CatalogResolvedIds {
  const ch = getCategoryHint(p)
  const bh = getBrandHint(p)
  return {
    categoryHint: ch,
    brandHint: bh,
    categoryId: matchEntityId(ch, categories),
    brandId: matchEntityId(bh, brands),
  }
}

function validateVariant(v: unknown, path: string): string[] {
  const err: string[] = []
  if (v == null || typeof v !== "object") return [`${path}: variante inválida`]
  const o = v as Record<string, unknown>
  const hasAttrs =
    o.attributes != null &&
    typeof o.attributes === "object" &&
    !Array.isArray(o.attributes) &&
    Object.keys(o.attributes as object).length > 0

  if (hasAttrs) {
    const attrs = o.attributes as Record<string, unknown>
    for (const [k, val] of Object.entries(attrs)) {
      if (typeof k !== "string" || !k.trim()) err.push(`${path}.attributes: chave inválida`)
      if (typeof val !== "string" || !String(val).trim()) {
        err.push(`${path}.attributes[${k}]: valor deve ser texto não vazio`)
      }
    }
  } else {
    if (typeof o.title !== "string" || !o.title.trim()) {
      err.push(`${path}: «title» obrigatório (ou define «attributes» com pelo menos uma chave)`)
    }
  }
  if (o.title != null && typeof o.title !== "string") err.push(`${path}.title deve ser texto`)
  const price = o.price
  if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) {
    err.push(`${path}: price deve ser um número > 0 (CVE)`)
  }
  const qty = o.quantity
  if (typeof qty !== "number" || !Number.isInteger(qty) || qty < 0) {
    err.push(`${path}: quantity deve ser inteiro ≥ 0`)
  }
  if (o.sku != null && typeof o.sku !== "string") err.push(`${path}: sku deve ser texto`)
  return err
}

export function validateProductShape(p: unknown, index: number): string[] {
  const path = `products[${index}]`
  const err: string[] = []
  if (p == null || typeof p !== "object") return [`${path}: objeto esperado`]
  const o = p as Record<string, unknown>
  if (typeof o.title !== "string" || !o.title.trim()) err.push(`${path}.title obrigatório`)
  const cond = o.condition
  if (cond !== "novo" && cond !== "seminovo") {
    err.push(`${path}.condition deve ser "novo" ou "seminovo"`)
  }
  const ch = String(o.categorySlug ?? o.categoryName ?? "").trim()
  const bh = String(o.brandSlug ?? o.brandName ?? "").trim()
  if (!ch) err.push(`${path}: categorySlug ou categoryName obrigatório`)
  if (!bh) err.push(`${path}: brandSlug ou brandName obrigatório`)
  if (o.discount != null) {
    const d = o.discount
    if (typeof d !== "number" || !Number.isInteger(d) || d < 0 || d > 100) {
      err.push(`${path}.discount deve ser inteiro 0–100`)
    }
  }
  if (o.variantOptionTitle != null) {
    if (typeof o.variantOptionTitle !== "string") {
      err.push(`${path}.variantOptionTitle deve ser texto`)
    } else if (!o.variantOptionTitle.trim()) {
      err.push(`${path}.variantOptionTitle não pode ser vazio`)
    }
  }
  const vars = o.variants
  if (!Array.isArray(vars) || vars.length === 0) {
    err.push(`${path}.variants: array com pelo menos uma variante`)
  } else {
    vars.forEach((v, j) => {
      err.push(...validateVariant(v, `${path}.variants[${j}]`))
    })
  }
  return err
}

export function parseCatalogSeedJson(raw: string): { ok: true; data: CatalogSeedFile } | { ok: false; error: string } {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw) as unknown
  } catch {
    return { ok: false, error: "JSON inválido (syntax)." }
  }
  if (parsed == null || typeof parsed !== "object") {
    return { ok: false, error: "Raiz deve ser um objeto." }
  }
  const root = parsed as Record<string, unknown>
  const products = root.products
  if (!Array.isArray(products)) {
    return { ok: false, error: "Campo «products» em falta ou não é array." }
  }
  return { ok: true, data: { meta: root.meta, products: products as CatalogSeedProduct[] } }
}

function checkVariantAxisConsistency(p: CatalogSeedProduct): string | null {
  if (!p.variants || p.variants.length <= 1) return null
  try {
    const keySets = p.variants.map((v) =>
      Object.keys(seedVariantAttributes(p, v)).sort().join("|")
    )
    if (new Set(keySets).size > 1) {
      return "Todas as variantes devem partilhar as mesmas chaves em «attributes» (ou o mesmo eixo «variantOptionTitle» + «title»)."
    }
  } catch (e) {
    return e instanceof Error ? e.message : String(e)
  }
  return null
}

export function collectImportIssues(
  data: CatalogSeedFile,
  categories: { id: string; name: string; slug: string }[],
  brands: { id: string; name: string; slug: string }[],
  opts?: { skipEntityResolution?: boolean }
): CatalogImportRowIssue[] {
  const issues: CatalogImportRowIssue[] = []
  data.products.forEach((p, i) => {
    const shape = validateProductShape(p, i)
    const title = typeof p?.title === "string" ? p.title : `(índice ${i})`
    const messages = [...shape]
    if (shape.length === 0) {
      if (!opts?.skipEntityResolution) {
        const r = resolveProductRefs(p, categories, brands)
        if (!r.categoryId) messages.push(`Categoria não encontrada: «${r.categoryHint}»`)
        if (!r.brandId) messages.push(`Marca não encontrada: «${r.brandHint}»`)
        if (r.categoryId && r.brandId) {
          const axis = checkVariantAxisConsistency(p)
          if (axis) messages.push(axis)
        }
      } else {
        const axis = checkVariantAxisConsistency(p)
        if (axis) messages.push(axis)
      }
    }
    if (messages.length) issues.push({ productIndex: i, title, messages })
  })
  return issues
}

export function isCatalogImportReady(issues: CatalogImportRowIssue[]): boolean {
  return issues.length === 0
}
