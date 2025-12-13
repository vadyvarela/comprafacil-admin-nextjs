import { gql } from "@apollo/client"

export const GET_CATEGORIES = gql`
  query GetCategories($filter: CategoryFilterInput, $page: PageInput!) {
    categories(filter: $filter, page: $page) {
      data {
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
          slug
        }
        createdAt
        updatedAt
      }
      pageNumber
      pageSize
      totalElements
      totalPages
    }
  }
`

export const GET_CATEGORY_LIST = gql`
  query GetCategoryList {
    categoryList {
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
        slug
      }
    }
  }
`

export const GET_CATEGORY = gql`
  query GetCategory($id: UUID!) {
    categoryDetails(id: $id) {
      id
      name
      slug
      description
      image
      icon
      metadata
      status {
        code
        description
      }
      orderIndex
      parentCategory {
        id
        name
        slug
      }
      createdAt
      updatedAt
    }
  }
`

