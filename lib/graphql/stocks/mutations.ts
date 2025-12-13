import { gql } from "@apollo/client"

export const CREATE_STOCK = gql`
  mutation CreateStock($input: StockInput!) {
    createStock(input: $input) {
      id
      name
      quantity
      product {
        id
      }
    }
  }
`

export const UPDATE_STOCK = gql`
  mutation UpdateStock($stockId: UUID!, $input: StockInput!) {
    updateStock(stockId: $stockId, input: $input) {
      id
      name
      quantity
      product {
        id
      }
    }
  }
`

