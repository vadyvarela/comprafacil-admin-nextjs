export interface Brand {
  id: string
  name: string
  slug: string
  description?: string | null
  image?: string | null
  logo?: string | null
  metadata?: string | null
  status?: {
    code: string
    description: string
  } | null
  orderIndex?: number | null
  createdAt?: string | null
  updatedAt?: string | null
}

export interface BrandPage {
  data: Brand[]
  pageNumber?: number | null
  pageSize?: number | null
  totalElements?: number | null
  totalPages?: number | null
}

