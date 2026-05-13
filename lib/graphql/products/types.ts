/** Alinhado a `ProductFilterInput` no gateway GraphQL. */
export interface ProductFilterInput {
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
  metadata?: string | null
}

export interface ProductVariantUpdateInput {
  title?: string
  quantity?: number
  metadata?: string | null
}

