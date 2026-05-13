import { gql } from "@apollo/client"

export const GET_STORE_HOME_LAYOUT = gql`
  query GetStoreHomeLayout {
    storeHomeLayout {
      id
      draftPayload
      publishedPayload
      publishedAt
      updatedAt
    }
  }
`
