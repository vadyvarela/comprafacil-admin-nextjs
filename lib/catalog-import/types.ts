export interface CatalogSeedVariant {
  title: string
  price: number
  quantity: number
  sku?: string
}

export interface CatalogSeedProduct {
  title: string
  summary?: string | null
  condition: string
  categorySlug?: string
  brandSlug?: string
  categoryName?: string
  brandName?: string
  discount?: number | null
  sku?: string
  variants: CatalogSeedVariant[]
}

export interface CatalogSeedFile {
  meta?: unknown
  products: CatalogSeedProduct[]
}

export interface CatalogImportRowIssue {
  productIndex: number
  title: string
  messages: string[]
}

export interface CatalogResolvedIds {
  categoryId: string | null
  brandId: string | null
  categoryHint: string
  brandHint: string
}
