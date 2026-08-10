import { gql } from "@apollo/client"

export const GET_PRODUCTS = gql`
  query GetProducts($filter: ProductFilterInput, $page: PageInput!) {
    products(filter: $filter, page: $page) {
      data {
        id
        title
        description
        image
        discount
        condition
        metadata
        status {
          code
          description
        }
        brand {
          id
          name
          slug
          logo
        }
        category {
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

export const GET_PRODUCT = gql`
  query GetProduct($id: UUID!) {
    productDetails(id: $id) {
      id
      title
      description
      summary
      image
      discount
      condition
      type {
        code
      }
      status {
        code
        description
      }
      metadata
      stock {
        id
        name
        quantity
      }
      category {
        id
        name
        slug
      }
      brand {
        id
        name
        slug
        logo
      }
      variants {
        id
        title
        quantity
        image
        price {
          id
          nickname
          unitAmount
          currency
        }
        metadata
      }
      createdAt
      updatedAt
    }
  }
`

export const GET_PRODUCT_LIST = gql`
  query GetProductList($filter: ProductFilterInput, $page: PageInput!) {
    products(filter: $filter, page: $page) {
      data {
        id
        title
      }
    }
  }
`
