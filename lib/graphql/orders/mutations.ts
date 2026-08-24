import { gql } from "@apollo/client"

export const UPDATE_ORDER_FULFILLMENT_STATUS = gql`
  mutation UpdateOrderFulfillmentStatus(
    $checkoutSessionId: UUID!
    $fulfillmentStatus: String!
    $actor: AuditActorInput
  ) {
    updateOrderFulfillmentStatus(
      checkoutSessionId: $checkoutSessionId
      fulfillmentStatus: $fulfillmentStatus
      actor: $actor
    ) {
      id
      fulfillmentStatus {
        code
        description
      }
    }
  }
`
