export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  image?: string
  icon?: string
  metadata?: string
  status?: {
    code: string
    description: string
  }
  orderIndex?: number
  parentCategory?: Category
  createdAt?: string
  updatedAt?: string
}

export interface CategoryPage {
  data: Category[]
  pageNumber?: number
  pageSize?: number
  totalElements?: number
  totalPages?: number
}

export interface CategoryInput {
  name: string
  slug: string
  description?: string
  image?: string
  icon?: string
  metadata?: string
  status?: {
    code: string
  }
  orderIndex?: number
  parentCategoryId?: string
}

export interface CategoryFilterInput {
  name?: string
  slug?: string
  status?: string
  search?: string
  parentCategoryId?: string
}

