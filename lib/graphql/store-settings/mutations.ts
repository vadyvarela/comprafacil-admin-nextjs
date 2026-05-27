import { gql } from "@apollo/client"

export const UPDATE_STORE_SETTINGS = gql`
  mutation UpdateStoreSettings(
    $siteName: String!
    $siteDescription: String
    $logoUrl: String
    $faviconUrl: String
    $ogImageUrl: String
    $supportEmail: String
    $supportPhonePrimary: String
    $supportPhoneSecondary: String
    $address: String
    $facebookUrl: String
    $instagramUrl: String
    $whatsappNumber: String
  ) {
    updateStoreSettings(
      siteName: $siteName
      siteDescription: $siteDescription
      logoUrl: $logoUrl
      faviconUrl: $faviconUrl
      ogImageUrl: $ogImageUrl
      supportEmail: $supportEmail
      supportPhonePrimary: $supportPhonePrimary
      supportPhoneSecondary: $supportPhoneSecondary
      address: $address
      facebookUrl: $facebookUrl
      instagramUrl: $instagramUrl
      whatsappNumber: $whatsappNumber
    ) {
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
