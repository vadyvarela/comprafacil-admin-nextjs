export interface Product {
  id: string
  title: string
  description?: string | null
  summary?: string | null
  image?: string | null
  discount?: number | null
  type: {
    code: string
  }
  metadata?: string | null
  brand?: {
    id: string
    name: string
    slug: string
    logo?: string | null
  } | null
  category?: {
    id: string
    name: string
    slug: string
  } | null
  stock?: {
    id: string
    name?: string | null
    quantity: number
  } | null
  variants?: ProductVariant[]
  createdAt?: string
  updatedAt?: string
}

export interface ProductVariant {
  id: string
  title: string
  quantity: number
  price?: {
    id: string
    nickname?: string
    unitAmount: number
    currency: string
  } | null
  metadata?: string | null
}

export interface ProductInput {
  title: string
  description?: string | null
  summary?: string | null
  discount?: number | null
  type: {
    code: string
  }
  metadata?: string | null
}

export interface ProductUpdateInput {
  title?: string
  description?: string | null
  type?: {
    code: string
  }
  metadata?: string | null
}

export interface ProductVariantInput {
  productId: string
  title: string
  quantity: number
  metadata?: string | null
}

export interface ProductVariantUpdateInput {
  title?: string
  quantity?: number
  metadata?: string | null
}

