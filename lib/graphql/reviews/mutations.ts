import { gql } from "@apollo/client"
import { ADMIN_PRODUCT_REVIEW_FIELDS } from "./queries"

export const MODERATE_PRODUCT_REVIEW = gql`
  mutation ModerateProductReview(
    $id: UUID!
    $moderationStatus: ProductReviewModerationStatus!
    $rejectionReason: String
  ) {
    moderateProductReview(
      id: $id
      moderationStatus: $moderationStatus
      rejectionReason: $rejectionReason
    ) {
      ...AdminProductReviewFields
    }
  }
  ${ADMIN_PRODUCT_REVIEW_FIELDS}
`

export const REPLY_PRODUCT_REVIEW = gql`
  mutation ReplyProductReview($id: UUID!, $replyText: String) {
    replyProductReview(id: $id, replyText: $replyText) {
      ...AdminProductReviewFields
    }
  }
  ${ADMIN_PRODUCT_REVIEW_FIELDS}
`

export const DELETE_PRODUCT_REVIEW = gql`
  mutation DeleteProductReview($id: UUID!) {
    deleteProductReview(id: $id)
  }
`
