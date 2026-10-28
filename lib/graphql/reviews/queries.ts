import { gql } from "@apollo/client"

export const ADMIN_PRODUCT_REVIEW_FIELDS = gql`
  fragment AdminProductReviewFields on AdminProductReviewResponse {
    id
    productId
    authorName
    authorFullName
    authorEmail
    customerId
    checkoutSessionId
    rating
    title
    comment
    verifiedPurchase
    images {
      id
      url
    }
    moderationStatus {
      code
      description
    }
    moderatedAt
    moderatedBy
    rejectionReason
    replyText
    repliedAt
    repliedBy
    createdAt
    updatedAt
    product {
      id
      title
      image
    }
  }
`

export const ADMIN_PRODUCT_REVIEWS = gql`
  query AdminProductReviews($filter: ProductReviewFilterInput, $page: PageInput) {
    adminProductReviews(filter: $filter, page: $page) {
      data {
        ...AdminProductReviewFields
      }
      pageNumber
      pageSize
      totalElements
      totalPages
    }
  }
  ${ADMIN_PRODUCT_REVIEW_FIELDS}
`

export const PENDING_PRODUCT_REVIEW_COUNT = gql`
  query PendingProductReviewCount {
    pendingProductReviewCount
  }
`
