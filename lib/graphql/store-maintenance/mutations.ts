import { gql } from "@apollo/client"

export const UPDATE_STORE_MAINTENANCE = gql`
  mutation UpdateStoreMaintenance($enabled: Boolean!, $message: String) {
    updateStoreMaintenance(enabled: $enabled, message: $message) {
      id
      enabled
      message
      updatedAt
    }
  }
`
