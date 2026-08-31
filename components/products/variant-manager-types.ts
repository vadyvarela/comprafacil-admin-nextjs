import type { MetaCatalogMetadataInput } from "@/lib/products/meta-catalog-metadata"

export interface ProductVariantCombination {
  id?: string
  optionValues: Record<string, string>
  price: string
  stock: number
  image?: string
  sku?: string
  images?: string[]
  hoverImageUrl?: string | null
  semFaceId?: boolean
  batteryHealthPercent?: string
  offerEnabled?: boolean
  offerTitle?: string
  offerItems?: string[]
  discount?: string
  metaCatalog?: MetaCatalogMetadataInput
}
