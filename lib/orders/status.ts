/**
 * Helpers de status de pedido (sem server-only, usáveis em client components).
 */

/** Label de status para exibição (gateway: OPEN, COMPLETED, EXPIRED). */
export function getOrderStatusLabel(code: string): string {
  const labels: Record<string, string> = {
    OPEN: "Aberto",
    COMPLETED: "Pago",
    EXPIRED: "Expirado",
  }
  return labels[code?.toUpperCase() ?? ""] ?? code ?? "—"
}

/** Variante do Badge por status. */
export function getOrderStatusVariant(
  code: string
): "default" | "secondary" | "destructive" | "outline" {
  const c = code?.toUpperCase() ?? ""
  if (c === "COMPLETED") return "default"
  if (c === "EXPIRED") return "destructive"
  return "secondary"
}
