/** Alinhado a `ProductFilterInput` no gateway GraphQL. */
export interface ProductFilterInput {
  /** LIKE case-insensitive no gateway (ex.: título completo do produto). */
  title?: string | null
  search?: string | null
  categoryId?: string | null
  brandId?: string | null
  withoutCategory?: boolean | null
  withoutBrand?: boolean | null
  /** Listagem só produtos com `metadata.featured === true` (gateway). */
  featured?: boolean | null
  /** Filtra por estes IDs; ordem da resposta segue a lista no gateway. */
  ids?: string[] | null
}

export interface Product {
  id: string
  title: string
  description?: string | null
  summary?: string | null
  image?: string | null
  discount?: number | null
  condition?: string | null
  /** Incluído em queries de detalhe; omitido na listagem. */
  type?: {
    code: string
  } | null
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
  image?: string | null
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
  condition?: string | null
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
  condition?: string | null
  metadata?: string | null
}

export interface ProductVariantInput {
  productId: string
  title: string
  quantity: number
  image?: string | null
  metadata?: string | null
  priceData?: {
    nickname: string
    unitAmount: number
    currency: string
  }
}

export interface ProductVariantUpdateInput {
  productId: string
  title?: string
  quantity?: number
  image?: string | null
  metadata?: string | null
}

