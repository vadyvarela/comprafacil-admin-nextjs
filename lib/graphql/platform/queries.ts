import { gql } from "@apollo/client"

export const PLATFORM_REVENUE = gql`
  query PlatformRevenue($filter: PlatformRevenueFilterInput) {
    platformRevenue(filter: $filter) {
      commissionRate
      currency
      grossAmount
      commissionAmount
      orderCount
      months {
        month
        grossAmount
        commissionAmount
        orderCount
      }
    }
  }
`

export const PLATFORM_TRANSACTIONS = gql`
  query PlatformTransactions($filter: PlatformTransactionFilterInput, $page: PageInput!) {
    platformTransactions(filter: $filter, page: $page) {
      data {
        id
        merchantReference
        status
        statusLabel
        statusReason
        createdAt
        capturedAt
        amount
        commission
        currency
        checkoutSessionId
        storeName
        customerName
        customerEmail
        customerPhone
        cardBrand
        cardLast4
        shippingAmount
        discountAmount
        fulfillmentStatus
        items {
          description
          quantity
          unitAmount
        }
      }
      pageNumber
      pageSize
      totalElements
      totalPages
    }
  }
`

export const PLATFORM_EVENTS = gql`
  query PlatformEvents($filter: PlatformEventFilterInput, $page: PageInput!) {
    platformEvents(filter: $filter, page: $page) {
      data {
        id
        createdAt
        level
        kind
        title
        message
        storeId
        storeName
        metadata
      }
      pageNumber
      pageSize
      totalElements
      totalPages
    }
  }
`

export const PLATFORM_STORES = gql`
  query PlatformStores {
    platformStores {
      id
      slug
      name
      status
      commissionRate
      createdAt
    }
  }
`

export const CREATE_STORE = gql`
  mutation CreateStore($input: CreateStoreInput!) {
    createStore(input: $input) {
      store {
        id
        slug
        name
        status
        commissionRate
        createdAt
      }
      storefrontToken
    }
  }
`
