import { gql } from "@apollo/client"

export const CHECKOUT_SESSION_SEARCH = gql`
  query CheckoutSessionSearch($filter: PaymentFilterRequest, $page: PageInput!) {
    checkoutSessionSearch(filter: $filter, page: $page) {
      data {
        id
        mode
        currency
        submitType
        amountDiscount
        paymentProviderType
        status {
          code
          description
        }
        url
        cancelUrl
        returnUrl
        createdAt
        updatedAt
        customer {
          id
          customerExternalId
          name
          email
          identifier
        }
      }
      pageNumber
      pageSize
      totalElements
      totalPages
    }
  }
`

export const CHECKOUT_SESSION_DETAILS = gql`
  query CheckoutSessionDetails($id: UUID!) {
    checkoutSessionDetails(id: $id) {
      id
      mode
      currency
      submitType
      amountDiscount
      paymentProviderType
      status {
        code
        description
      }
      url
      cancelUrl
      returnUrl
      createdAt
      updatedAt
      paymentMode
      maximumNumberOfInstallments
      hasPaymentIntent
      # Descomentar quando o gateway tiver metadata em CheckoutSessionDetailsResponse (endereço da compra)
      # metadata
      customer {
        id
        customerExternalId
        name
        email
        identifier
      }
      lines {
        id
        description
        quantity
        unitAmount
        currency
        status {
          code
          description
        }
        productVariant {
          id
          title
          product {
            id
            title
          }
        }
      }
    }
  }
`
