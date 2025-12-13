export interface Stock {
  id: string
  name?: string
  description?: string
  quantity: number
  metadata?: string
  productId?: string
}

export interface StockInput {
  name: string
  description?: string
  quantity: number
  metadata?: string
  productId?: string
  status?: {
    code: string
  }
}

