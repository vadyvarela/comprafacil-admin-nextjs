export type ReviewModerationStatus = "PENDING" | "APPROVED" | "REJECTED"

export interface ReviewImage {
  id: string
  url: string
}

export interface AdminProductReview {
  id: string
  productId: string
  authorName: string
  authorFullName: string
  authorEmail: string | null
  customerId: string | null
  checkoutSessionId: string | null
  rating: number
  title: string | null
  comment: string | null
  verifiedPurchase: boolean
  images: ReviewImage[]
  moderationStatus: { code: ReviewModerationStatus; description: string }
  moderatedAt: string | null
  moderatedBy: string | null
  rejectionReason: string | null
  replyText: string | null
  repliedAt: string | null
  repliedBy: string | null
  createdAt: string
  updatedAt: string | null
  product: { id: string; title: string | null; image: string | null } | null
}

export interface AdminProductReviewPage {
  data: AdminProductReview[]
  pageNumber: number | null
  pageSize: number | null
  totalElements: number | null
  totalPages: number | null
}

export interface ProductReviewFilter {
  moderationStatus?: ReviewModerationStatus | null
  productId?: string | null
  rating?: number | null
  search?: string | null
}
