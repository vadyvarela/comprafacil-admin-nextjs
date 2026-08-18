import "server-only"
import { runGraphQL } from "./graphql"
import { GET_PRODUCTS } from "@/lib/graphql/products/queries"
import { GET_CATEGORY_LIST } from "@/lib/graphql/categories/queries"
import { GET_BRAND_LIST } from "@/lib/graphql/brands/queries"
import type { Product } from "@/lib/graphql/products/types"
import {
  buildProductListFilter,
  PRODUCT_PAGE_SIZE,
  type ProductBrandOption,
  type ProductCategoryOption,
  type ProductListFilterParams,
} from "@/lib/products/list-filters"

export {
  FILTER_ALL,
  FILTER_NONE,
  PRODUCT_PAGE_SIZE,
  buildProductListFilter,
} from "@/lib/products/list-filters"
export type {
  ProductBrandOption,
  ProductCategoryOption,
  ProductListFilterParams,
} from "@/lib/products/list-filters"

export interface ProductPageResponse {
  data: Product[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
}

export interface GetProductsParams extends ProductListFilterParams {
  page?: number
}

export type GetProductsResult =
  | { ok: true; data: ProductPageResponse }
  | { ok: false; error: string }

function emptyPage(page: number): ProductPageResponse {
  return {
    data: [],
    pageNumber: page,
    pageSize: PRODUCT_PAGE_SIZE,
    totalElements: 0,
    totalPages: 0,
  }
}

export async function getProducts(
  params: GetProductsParams = {}
): Promise<GetProductsResult> {
  const page = Math.max(0, params.page ?? 0)
  const filter = buildProductListFilter(params)

  const result = await runGraphQL<{ products: ProductPageResponse }>(GET_PRODUCTS, {
    filter,
    page: {
      page,
      size: PRODUCT_PAGE_SIZE,
      sortBy: "createdAt",
      sortDirection: "DESC",
    },
  })

  if (result.errors?.length) {
    return { ok: false, error: result.errors.map((e) => e.message).join("; ") }
  }

  const products = result.data?.products
  if (!products) {
    return { ok: true, data: emptyPage(page) }
  }

  return { ok: true, data: products }
}

export async function getProductFilterOptions(): Promise<{
  categories: ProductCategoryOption[]
  brands: ProductBrandOption[]
}> {
  const [categoriesResult, brandsResult] = await Promise.all([
    runGraphQL<{
      categoryList: ProductCategoryOption[]
    }>(GET_CATEGORY_LIST),
    runGraphQL<{
      brandList: ProductBrandOption[]
    }>(GET_BRAND_LIST),
  ])

  return {
    categories: categoriesResult.data?.categoryList ?? [],
    brands: brandsResult.data?.brandList ?? [],
  }
}
