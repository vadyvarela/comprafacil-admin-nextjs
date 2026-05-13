/**
 * Regra Fase 0: `seeAllHref` só paths internos (sem protocolo, sem //).
 * Primeiro segmento do path deve estar na allowlist.
 */
const ALLOWED_FIRST_SEGMENTS = new Set([
  "produtos",
  "categoria",
  "categorias",
  "ofertas",
  "busca",
])

/** Atalhos para o editor (todos passam `isAllowedInternalHref`). */
export const INTERNAL_PATH_PRESETS: readonly { href: string; label: string }[] = [
  { href: "/produtos", label: "Produtos" },
  { href: "/produtos?sort=newest", label: "Produtos — novidades" },
  { href: "/produtos?sort=bestsellers", label: "Produtos — mais vendidos" },
  { href: "/ofertas", label: "Ofertas" },
  { href: "/categorias", label: "Categorias" },
  { href: "/busca", label: "Busca" },
] as const

export function isAllowedInternalHref(href: string): boolean {
  if (typeof href !== "string" || href.length === 0) return false
  if (href.includes("://")) return false
  if (!href.startsWith("/")) return false
  if (href.startsWith("//")) return false
  const pathOnly = href.split("?")[0]?.split("#")[0] ?? ""
  const segments = pathOnly.split("/").filter(Boolean)
  const first = segments[0]
  return first != null && ALLOWED_FIRST_SEGMENTS.has(first)
}
