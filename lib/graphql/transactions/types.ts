/**
 * Tipos para paymentsSearch (transações / payment intents).
 * Alinhado ao zing-payment-gateway-dashboard-ui-nextjs.
 */

export interface PaymentPageRequest {
  page?: number | null
  size?: number | null
  sortBy?: string | null
  sortDirection?: string | null
}

export interface PaymentFilterRequest {
  customerId?: string | null
  status?: string | null
  merchantReference?: string | null
  amount?: number | null
  authorizedAt?: string | null
  search?: string | null
  dateFrom?: string | null
  dateTo?: string | null
}

export interface PaymentStatus {
  code: string
  description: string
}

export interface PaymentCustomer {
  id: string
  name: string
  email: string
  phone: string
}

export interface PaymentProduct {
  id: string
  title: string
  description: string
  image: string
  metadata: string | null
}

export interface PaymentProductVariant {
  title: string
  description: string
  quantity: number
  image: string | null
  product: PaymentProduct | null
}

export interface CheckoutSessionLine {
  quantity: number
  productVariant: PaymentProductVariant
}

export interface InstallmentPlan {
  amount: number
  dueDate: string
}

export interface CheckoutSession {
  id: string
  paymentMode: string
  lines: CheckoutSessionLine[]
  maximumNumberOfInstallments: number | null
  installmentPlans: InstallmentPlan[]
  amountDiscount: number | null
}

export interface PaymentInvoice {
  number: string
  amountTotal: number
  amountPaid: number
  currency: string
  url: string
  dueDate: string | null
}

export interface PaymentReceipt {
  number: string
  sendTo: string
  sentAt: string | null
  deliveryStatus: string
  url: string
}

export interface PaymentIntent {
  id: string
  canceledAt: string | null
  merchantReference: string
  responseMetadata: string
  statusReason: string | null
  statementDescriptor: string | null
  description: string | null
  amount: number
  currency: string
  authorizedAt: string | null
  capturedAt: string | null
  canceledReason: string | null
  metadata: Record<string, unknown> | null
  status: PaymentStatus
  createdAt: string
  updatedAt: string
  customer: PaymentCustomer
  checkoutSession: CheckoutSession | null
  invoicePath: string | null
  invoice: PaymentInvoice | null
  receipt: PaymentReceipt | null
}

export interface PaymentsSearchResponse {
  paymentsSearch: {
    data: PaymentIntent[]
    pageNumber: number
    pageSize: number
    totalElements: number
    totalPages: number
  }
}

export interface PaymentsPage {
  data: PaymentIntent[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
}
