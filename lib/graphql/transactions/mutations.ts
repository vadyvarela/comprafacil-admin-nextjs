import { gql } from "@apollo/client"

export const DELETE_PAYMENT_INTENT = gql`
  mutation DeletePaymentIntent($id: ID!) {
    deletePaymentIntent(id: $id) {
      id
    }
  }
`
