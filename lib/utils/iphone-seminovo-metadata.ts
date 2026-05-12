/** Heurística para mostrar campos informativos (Face ID / bateria) só em iPhone seminovo. */
export function looksLikeIphoneProduct(parts: {
  title: string
  categoryName?: string | null
  categorySlug?: string | null
  brandName?: string | null
}): boolean {
  const t = (parts.title || "").toLowerCase()
  const cn = (parts.categoryName || "").toLowerCase()
  const cs = (parts.categorySlug || "").toLowerCase()
  const bn = (parts.brandName || "").toLowerCase()
  if (/\biphone\b/i.test(t) || /\biphone\b/i.test(cn) || cs.includes("iphone")) return true
  if (bn.includes("apple") && /\biphone\b/i.test(t)) return true
  return false
}

export function normalizeBatteryHealthPercent(raw: string): number | null {
  const n = parseInt(String(raw).trim(), 10)
  if (!Number.isFinite(n) || n < 0 || n > 100) return null
  return n
}
