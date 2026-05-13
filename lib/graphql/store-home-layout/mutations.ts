import { gql } from "@apollo/client"

export const SAVE_STORE_HOME_LAYOUT_DRAFT = gql`
  mutation SaveStoreHomeLayoutDraft($payload: JSON!) {
    saveStoreHomeLayoutDraft(payload: $payload) {
      id
      draftPayload
      publishedPayload
      publishedAt
      updatedAt
    }
  }
`

export const PUBLISH_STORE_HOME_LAYOUT = gql`
  mutation PublishStoreHomeLayout($payload: JSON!) {
    publishStoreHomeLayout(payload: $payload) {
      id
      draftPayload
      publishedPayload
      publishedAt
      updatedAt
    }
  }
`
