import { gql } from "@apollo/client"

export const CUSTOMERS_SEARCH = gql`
  query CustomersSearch($filter: CustomerFilterRequest, $page: PageInput!) {
    customers(filter: $filter, page: $page) {
      data {
        id
        customerExternalId
        name
        identifier
        email
        phone
        status { code description }
        createdAt
      }
      pageNumber
      pageSize
      totalElements
      totalPages
    }
  }
`

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
