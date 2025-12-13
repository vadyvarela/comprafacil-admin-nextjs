import { gql } from "@apollo/client"

export const CREATE_BRAND = gql`
  mutation CreateBrand($input: BrandInput!) {
    createBrand(input: $input) {
      id
      name
      slug
      description
      image
      logo
      metadata
      status {
        code
        description
      }
      orderIndex
      createdAt
      updatedAt
    }
  }
`

export const UPDATE_BRAND = gql`
  mutation UpdateBrand($id: UUID!, $input: BrandInput!) {
    updateBrand(id: $id, input: $input) {
      id
      name
      slug
      description
      image
      logo
      metadata
      status {
        code
        description
      }
      orderIndex
      createdAt
      updatedAt
    }
  }
`

export const DELETE_BRAND = gql`
  mutation DeleteBrand($id: UUID!) {
    deleteBrand(id: $id) {
      id
      name
      slug
    }
  }
`

