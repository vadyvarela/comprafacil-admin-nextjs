import { gql } from "@apollo/client"

export const CREATE_PRODUCT = gql`
  mutation CreateProduct($input: ProductInput!) {
    createProduct(input: $input) {
      id
      title
      description
      summary
      discount
      type {
        code
      }
      metadata
      stock {
        id
        name
        quantity
      }
    }
  }
`

export const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($id: UUID!, $input: ProductInput!) {
    updateProduct(id: $id, input: $input) {
      id
      title
      description
      summary
      discount
      type {
        code
      }
      metadata
      category {
        id
        name
        slug
      }
    }
  }
`

export const DELETE_PRODUCT = gql`
  mutation DeleteProduct($id: UUID!) {
    deleteProduct(id: $id) {
      id
    }
  }
`

