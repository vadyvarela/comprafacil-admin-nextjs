import { gql } from "@apollo/client"

export const CREATE_CATEGORY = gql`
  mutation CreateCategory($input: CategoryInput!) {
    createCategory(input: $input) {
      id
      name
      slug
      description
      image
      icon
      status {
        code
        description
      }
      orderIndex
      parentCategory {
        id
        name
      }
    }
  }
`

export const UPDATE_CATEGORY = gql`
  mutation UpdateCategory($id: UUID!, $input: CategoryInput!) {
    updateCategory(id: $id, input: $input) {
      id
      name
      slug
      description
      image
      icon
      status {
        code
        description
      }
      orderIndex
      parentCategory {
        id
        name
      }
    }
  }
`

export const DELETE_CATEGORY = gql`
  mutation DeleteCategory($id: UUID!) {
    deleteCategory(id: $id) {
      id
    }
  }
`

