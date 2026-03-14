import { gql } from "@apollo/client"

export const UPDATE_ORDER_FULFILLMENT_STATUS = gql`
  mutation UpdateOrderFulfillmentStatus($checkoutSessionId: UUID!, $fulfillmentStatus: String!) {
    updateOrderFulfillmentStatus(
      checkoutSessionId: $checkoutSessionId
      fulfillmentStatus: $fulfillmentStatus
    ) {
      id
      fulfillmentStatus {
        code
        description
      }
    }
  }
`
