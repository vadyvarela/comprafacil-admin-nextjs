import { gql } from "@apollo/client"

const PAYMENT_FIELDS = `
  id
  canceledAt
  merchantReference
  responseMetadata
  statusReason
  statementDescriptor
  description
  amount
  currency
  authorizedAt
  capturedAt
  canceledReason
  metadata
  status {
    code
    description
  }
  createdAt
  updatedAt
  customer {
    id
    name
    email
    phone
  }
  checkoutSession {
    id
    paymentMode
    lines {
      quantity
      productVariant {
        title
        description
        quantity
        image
        product {
          id
          title
          description
          image
          metadata
        }
      }
    }
    maximumNumberOfInstallments
    installmentPlans {
      amount
      dueDate
    }
    amountDiscount
  }
  invoicePath
  invoice {
    id
    number
    amountTotal
    amountPaid
    currency
    url
    dueDate
  }
  receipt {
    id
    number
    sendTo
    sentAt
    deliveryStatus
    url
  }
`

/**
 * Query para buscar um único payment intent pelo ID.
 */
export const PAYMENT_INTENT_BY_ID = gql`
  query paymentIntent($id: ID!) {
    paymentIntent(id: $id) {
      ${PAYMENT_FIELDS}
    }
  }
`

/**
 * Query paymentsSearch do gateway – lista de payment intents (transações).
 * Mesmo contrato do zing-payment-gateway-dashboard-ui-nextjs.
 */
export const PAYMENTS_SEARCH = gql`
  query paymentsSearch($filter: PaymentFilterRequest, $page: PageInput!) {
    paymentsSearch(filter: $filter, page: $page) {
      data {
        id
        canceledAt
        merchantReference
        responseMetadata
        statusReason
        statementDescriptor
        description
        amount
        currency
        authorizedAt
        capturedAt
        canceledReason
        metadata
        status {
          code
          description
        }
        createdAt
        updatedAt
        customer {
          id
          name
          email
          phone
        }
        checkoutSession {
          id
          paymentMode
          lines {
            quantity
            productVariant {
              title
              description
              quantity
              image
              product {
                id
                title
                description
                image
                metadata
              }
            }
          }
          maximumNumberOfInstallments
          installmentPlans {
            amount
            dueDate
          }
          amountDiscount
        }
        invoicePath
        invoice {
          id
          number
          amountTotal
          amountPaid
          currency
          url
          dueDate
        }
        receipt {
          id
          number
          sendTo
          sentAt
          deliveryStatus
          url
        }
      }
      pageNumber
      pageSize
      totalElements
      totalPages
    }
  }
`
