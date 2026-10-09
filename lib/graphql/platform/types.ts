/** Valores monetários em unidades mínimas (centavos), como vêm da API. */

export type PlatformRevenueMonth = {
  /** AAAA-MM */
  month: string
  grossAmount: number
  commissionAmount: number
  orderCount: number
}

export type PlatformRevenueSummary = {
  commissionRate: number
  currency: string
  grossAmount: number
  commissionAmount: number
  orderCount: number
  months: PlatformRevenueMonth[]
}

export type PlatformTransaction = {
  id: string
  merchantReference: string
  status: string
  statusLabel: string
  statusReason?: string | null
  createdAt: string
  capturedAt?: string | null
  amount: number
  commission: number
  currency: string
  checkoutSessionId: string
  storeName?: string | null
  customerName?: string | null
  customerEmail?: string | null
  customerPhone?: string | null
  cardBrand?: string | null
  cardLast4?: string | null
  shippingAmount: number
  discountAmount: number
  fulfillmentStatus?: string | null
  items: { description: string; quantity: number; unitAmount: number }[]
}

export type PlatformEventLevel = "ERROR" | "WARN" | "INFO"

export type PlatformEvent = {
  id: string
  createdAt: string
  level: PlatformEventLevel | string
  kind: string
  title: string
  message?: string | null
  storeId?: string | null
  storeName?: string | null
  metadata?: unknown
}

export type Page<T> = {
  data: T[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
}

export type PageInput = {
  page: number
  size: number
}
