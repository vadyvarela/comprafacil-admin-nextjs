/** Pasta lógica quando o produto não tem marca. */
export const MEDIA_GROUP_NO_BRAND = "sem-marca"

/** Pastas fixas (não são marcas). */
const SYSTEM_GROUP_LABELS: Record<string, string> = {
  [MEDIA_GROUP_NO_BRAND]: "Sem marca",
  produtos: "Produtos (legado)",
  banners: "Banners",
  variantes: "Variantes (legado)",
  "store-brand": "Marca da loja",
}

export function mediaGroupFromBrandSlug(slug?: string | null): string {
  const t = (slug ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "")
  return t || MEDIA_GROUP_NO_BRAND
}

export function mediaGroupLabel(
  slug: string,
  brandNameBySlug?: Map<string, string> | Record<string, string>
): string {
  if (SYSTEM_GROUP_LABELS[slug]) return SYSTEM_GROUP_LABELS[slug]
  if (brandNameBySlug instanceof Map) {
    const name = brandNameBySlug.get(slug)
    if (name) return name
  } else if (brandNameBySlug?.[slug]) {
    return brandNameBySlug[slug]
  }
  return slug
}
