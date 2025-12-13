export interface Price {
  id: string
  nickname?: string
  unitAmount: number
  currency: string
  productVariantId?: string
  createdAt?: string
  updatedAt?: string
}

export interface PriceInput {
  nickname: string
  productVariantId?: string
  unitAmount: number
  currency: string
  taxIncluded?: string
  metadata?: string
  status?: {
    code: string
  }
}

export interface PriceUpdateInput {
  nickname?: string
  unitAmount?: number
  currency?: string
  taxIncluded?: string
  metadata?: string
  status?: {
    code: string
  }
}

