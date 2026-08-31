import { gql } from "@apollo/client"

export const COMMERCIAL_RECOVERY_LEADS = gql`
  query CommercialRecoveryLeads(
    $filter: CommercialRecoveryLeadFilterInput
    $page: PageInput!
  ) {
    commercialRecoveryLeads(filter: $filter, page: $page) {
      data {
        key
        customer {
          id
          name
          email
          phone
        }
        product {
          id
          title
          image
        }
        contactPhone
        contactEmail
        latestPayment {
          id
          merchantReference
          amount
          currency
          status {
            code
            description
          }
          statusReason
          createdAt
        }
        attemptCount
        opportunityAmount
        currency
        lastAttemptAt
        computedStatus
        followUp {
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
      pageNumber
      pageSize
      totalElements
      totalPages
      metrics {
        totalActive
        newCount
        contactedCount
        noAnswerCount
        overdueCount
        potentialAmount
        currency
      }
    }
  }
`
