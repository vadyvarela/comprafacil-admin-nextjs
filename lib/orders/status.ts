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

/** CSS class para badge colorido de status de pagamento. */
export function getOrderStatusClass(code: string): string {
  const c = code?.toUpperCase() ?? ""
  if (c === "COMPLETED") return "badge-success"
  if (c === "EXPIRED") return "badge-danger"
  return "badge-neutral"
}

/** Labels para estado de processamento/envio (fulfillment). */
export const FULFILLMENT_OPTIONS = [
  { code: "PENDING", label: "A processar" },
  { code: "PREPARING", label: "Em preparação" },
  { code: "SHIPPED", label: "Enviado" },
  { code: "DELIVERED", label: "Entregue" },
  { code: "CANCELLED", label: "Cancelado" },
] as const

export function getFulfillmentStatusLabel(code: string | null | undefined): string {
  if (!code) return "—"
  return FULFILLMENT_OPTIONS.find((o) => o.code === code?.toUpperCase())?.label ?? code
}

export function getFulfillmentStatusVariant(
  code: string | null | undefined
): "default" | "secondary" | "destructive" | "outline" {
  const c = code?.toUpperCase() ?? ""
  if (c === "DELIVERED") return "default"
  if (c === "SHIPPED" || c === "PREPARING") return "secondary"
  if (c === "CANCELLED") return "destructive"
  return "outline"
}

/** CSS class para badge colorido de fulfillment. */
export function getFulfillmentStatusClass(code: string | null | undefined): string {
  const c = code?.toUpperCase() ?? ""
  if (c === "DELIVERED") return "badge-success"
  if (c === "SHIPPED") return "badge-info"
  if (c === "PREPARING") return "badge-warning"
  if (c === "CANCELLED") return "badge-danger"
  if (c === "PENDING") return "badge-neutral"
  return "badge-neutral"
}
