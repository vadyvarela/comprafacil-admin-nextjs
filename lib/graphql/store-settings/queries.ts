import { gql } from "@apollo/client"

export const GET_STORE_SETTINGS = gql`
  query GetStoreSettings {
    storeSettings {
      id
      siteName
      siteDescription
      logoUrl
      faviconUrl
      ogImageUrl
      supportEmail
      supportPhonePrimary
      supportPhoneSecondary
      address
      facebookUrl
      instagramUrl
      whatsappNumber
      updatedAt
    }
  }
`
