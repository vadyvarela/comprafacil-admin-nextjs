import { gql } from "@apollo/client"

export const CREATE_PRODUCT_VARIANT = gql`
  mutation CreateProductVariant($input: ProductVariantInput!) {
    createProductVariant(input: $input) {
      id
      title
      quantity
      price {
        id
        unitAmount
        currency
      }
      metadata
    }
  }
`

export const UPDATE_PRODUCT_VARIANT = gql`
  mutation UpdateProductVariant($id: UUID!, $input: ProductVariantInput!) {
    updateProductVariant(id: $id, input: $input) {
      id
      title
      quantity
      price {
        id
        unitAmount
        currency
      }
      metadata
    }
  }
`

export const DELETE_PRODUCT_VARIANT = gql`
  mutation DeleteProductVariant($id: UUID!) {
    deleteProductVariant(id: $id) {
      id
    }
  }
`

