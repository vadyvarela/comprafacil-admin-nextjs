/** Labels amigáveis para ações e tipos de entidade nos logs. */

export const ACTION_LABELS: Record<string, string> = {
  ORDER_FULFILLMENT_STATUS_CHANGED: "Estado de envio",
  PRODUCT_CREATED: "Produto criado",
  PRODUCT_UPDATED: "Produto actualizado",
  COUPON_CREATED: "Cupão criado",
  COUPON_UPDATED: "Cupão actualizado",
}

export const ENTITY_TYPE_LABELS: Record<string, string> = {
  CHECKOUT_SESSION: "Pedido",
  PRODUCT: "Produto",
  COUPON: "Cupão",
}

export function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action
}

export function entityTypeLabel(entityType: string): string {
  return ENTITY_TYPE_LABELS[entityType] ?? entityType
}
