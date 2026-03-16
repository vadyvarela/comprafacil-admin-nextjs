/**
 * Tipos de pedidos usáveis em client e server (sem server-only).
 *
 * Abas de filtro por estado de processamento/envio (fulfillment).
 */
export type OrdersTab = "all" | "PENDING" | "PREPARING" | "SHIPPED" | "DELIVERED" | "CANCELLED"
