import type { ProductFilterInput } from "@/lib/graphql/products/types"

export const PRODUCT_PAGE_SIZE = 100
export const FILTER_ALL = "all"
export const FILTER_NONE = "__none__"

export type ProductCategoryOption = {
  id: string
  name: string
  parentCategory?: { id: string; name: string } | null
}

export type ProductBrandOption = {
  id: string
  name: string
}

export type ProductListFilterParams = {
  search?: string | null
  category?: string | null
  brand?: string | null
  status?: string | null
}

export function buildProductListFilter(params: ProductListFilterParams): ProductFilterInput {
  const search = params.search?.trim() || null
  const category = params.category?.trim() || FILTER_ALL
  const brand = params.brand?.trim() || FILTER_ALL
  const status = params.status?.trim() || FILTER_ALL

  const f: ProductFilterInput = {}
  if (search) f.search = search
  if (category === FILTER_NONE) f.withoutCategory = true
  else if (category !== FILTER_ALL) f.categoryId = category
  if (brand === FILTER_NONE) f.withoutBrand = true
  else if (brand !== FILTER_ALL) f.brandId = brand

  if (status === FILTER_ALL) {
    // Admin "Todos": incluir rascunhos; sem isto a API devolve só publicados.
    f.includeInactive = true
  } else {
    f.status = status
  }

  return f
}
