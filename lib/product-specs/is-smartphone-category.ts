/** Categoria «Smartphones» (slug ou nome no CMS). */
export function isSmartphoneCategory(
  category?: { slug?: string | null; name?: string | null } | null
): boolean {
  const slug = (category?.slug ?? "").toLowerCase().trim()
  if (slug === "smartphones" || slug === "smartphone") return true

  const name = (category?.name ?? "").toLowerCase()
  if (/\bsmartphones?\b/.test(name)) return true
  if (/\btelem[oó]veis?\b/.test(name)) return true

  return false
}
