import { gql } from "@apollo/client"

export const UPSERT_COMMERCIAL_LEAD_FOLLOW_UP = gql`
  mutation UpsertCommercialLeadFollowUp($input: UpsertCommercialLeadFollowUpInput!) {
    upsertCommercialLeadFollowUp(input: $input) {
      id
      customerId
      productId
      status
      note
      lastContactedAt
      nextContactAt
      closedAt
      createdAt
      updatedAt
    }
  }
`
