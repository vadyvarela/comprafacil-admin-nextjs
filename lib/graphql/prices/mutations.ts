import { gql } from "@apollo/client"

export const CREATE_PRICE = gql`
  mutation CreatePrice($input: PriceInput!) {
    createPrice(input: $input) {
      id
      nickname
      unitAmount
      currency
      createdAt
      updatedAt
    }
  }
`

export const UPDATE_PRICE = gql`
  mutation UpdatePrice($id: UUID!, $input: PriceInput!) {
    updatePrice(id: $id, input: $input) {
      id
      nickname
      unitAmount
      currency
      createdAt
      updatedAt
    }
  }
`

