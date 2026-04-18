/**
 * Tipos para checkout session (pedidos) – alinhados às queries GraphQL.
 */

export interface DomainModel {
  code: string
  description: string
}

export interface CustomerResponse {
  id: string
  customerExternalId?: string
  name?: string
  email?: string
  phone?: string
  identifier?: string
}

export interface CheckoutSessionResponse {
  id: string
  mode?: string
  currency?: string
  submitType?: string
  amountDiscount?: number
  paymentProviderType?: string
  status?: DomainModel
  url?: string
  cancelUrl?: string
  returnUrl?: string
  createdAt?: string
  updatedAt?: string
  customer?: CustomerResponse
}

export interface OrderItemResponse {
  id: string
  description?: string
  quantity: number
  unitAmount: number
  currency?: string
  status?: DomainModel
  productVariant?: {
    id: string
    title?: string
    image?: string | null
    product?: { id: string; title?: string; image?: string | null }
  }
}

export interface CheckoutSessionDetailsResponse {
  id: string
  mode?: string
  currency?: string
  submitType?: string
  amountDiscount?: number
  paymentProviderType?: string
  status?: DomainModel
  url?: string
  cancelUrl?: string
  returnUrl?: string
  createdAt?: string
  updatedAt?: string
  paymentMode?: string
  maximumNumberOfInstallments?: number
  hasPaymentIntent?: boolean
  /** JSON da sessão (ex.: basePayload com shippingAddress) */
  metadata?: string | null
  /** Estado de processamento/envio: PENDING, PREPARING, SHIPPED, DELIVERED, CANCELLED */
  fulfillmentStatus?: DomainModel | null
  customer?: CustomerResponse
  lines?: OrderItemResponse[]
}

/** Endereço de entrega guardado no metadata da sessão (basePayload.shippingAddress). */
export interface ShippingAddressFromMetadata {
  address1?: string | null
  address2?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  country?: string | null
  phone?: string | null
}

export interface CheckoutSessionPageResponse {
  data: CheckoutSessionResponse[]
  pageNumber?: number
  pageSize?: number
  totalElements?: number
  totalPages?: number
}

/** Pedido da lista enriquecido com total e resumo de produtos (uso em client e server). */
export interface OrderSummary extends CheckoutSessionResponse {
  totalAmount?: number | null
  currency?: string
  productSummary?: string | null
  /** URL da imagem do 1.º item (variante ou produto) para a lista de pedidos */
  primaryProductImageUrl?: string | null
  itemsCount?: number
  /** Número de linhas distintas no pedido (para badge "+N") */
  orderLineCount?: number
}
