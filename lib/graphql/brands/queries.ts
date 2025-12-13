import { gql } from "@apollo/client"

export const GET_BRANDS = gql`
  query GetBrands($filter: BrandFilterInput, $page: PageInput!) {
    brands(filter: $filter, page: $page) {
      data {
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
      pageNumber
      pageSize
      totalElements
      totalPages
    }
  }
`

export const GET_BRAND_LIST = gql`
  query GetBrandList {
    brandList {
      id
      name
      slug
      description
      image
      logo
      status {
        code
        description
      }
      orderIndex
    }
  }
`

export const GET_BRAND_DETAILS = gql`
  query GetBrandDetails($id: UUID!) {
    brandDetails(id: $id) {
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

