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
