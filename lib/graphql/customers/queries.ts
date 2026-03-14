import { gql } from "@apollo/client"

export const CUSTOMER_DETAILS = gql`
  query CustomerDetails($id: UUID!) {
    customerDetails(id: $id) {
      id
      customerExternalId
      name
      identifier
      email
      phone
      addresses {
        id
        type { code description }
        address1
        address2
        city
        state
        zip
        country
        isDefault
      }
    }
  }
`

export const CUSTOMER_DETAILS_BY_EXTERNAL_ID = gql`
  query CustomerDetailsByExternalId($customerExternalId: String!) {
    customerDetailsByExternalId(customerExternalId: $customerExternalId) {
      id
      customerExternalId
      name
      identifier
      email
      phone
      addresses {
        id
        type { code description }
        address1
        address2
        city
        state
        zip
        country
        isDefault
      }
    }
  }
`
