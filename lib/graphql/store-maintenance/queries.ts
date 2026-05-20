import { gql } from "@apollo/client"

export const GET_STORE_MAINTENANCE = gql`
  query GetStoreMaintenance {
    storeMaintenance {
      id
      enabled
      message
      updatedAt
    }
  }
`
