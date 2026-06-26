import { gql } from "@apollo/client"

const STORE_SETTINGS_FIELDS = `
  id
  siteName
  siteDescription
  logoUrl
  footerLogoUrl
  faviconUrl
  ogImageUrl
  supportEmail
  supportPhonePrimary
  supportPhoneSecondary
  address
  facebookUrl
  instagramUrl
  whatsappNumber
  colorBackground
  colorSurface
  colorPaper
  colorForeground
  colorMuted
  colorInk
  colorBorder
  colorBorderSubtle
  colorPrimary
  colorPrimaryDark
  colorPrimaryLight
  fontFamily
  layoutMode
  storeVertical
  tagline
  themeZoneOverrides
  popularSearchQueries
  updatedAt
`

export const UPDATE_STORE_SETTINGS = gql`
  mutation UpdateStoreSettings(
    $siteName: String!
    $siteDescription: String
    $logoUrl: String
    $footerLogoUrl: String
    $faviconUrl: String
    $ogImageUrl: String
    $supportEmail: String
    $supportPhonePrimary: String
    $supportPhoneSecondary: String
    $nif: String
    $address: String
    $facebookUrl: String
    $instagramUrl: String
    $whatsappNumber: String
    $popularSearchQueries: [String!]
    $productPageTrustBadges: String
    $productPageLayout: String
  ) {
    updateStoreSettings(
      siteName: $siteName
      siteDescription: $siteDescription
      logoUrl: $logoUrl
      footerLogoUrl: $footerLogoUrl
      faviconUrl: $faviconUrl
      ogImageUrl: $ogImageUrl
      supportEmail: $supportEmail
      supportPhonePrimary: $supportPhonePrimary
      supportPhoneSecondary: $supportPhoneSecondary
      nif: $nif
      address: $address
      facebookUrl: $facebookUrl
      instagramUrl: $instagramUrl
      whatsappNumber: $whatsappNumber
      popularSearchQueries: $popularSearchQueries
      productPageTrustBadges: $productPageTrustBadges
      productPageLayout: $productPageLayout
    ) {
      ${STORE_SETTINGS_FIELDS}
    }
  }
`

export const UPDATE_STORE_THEME = gql`
  mutation UpdateStoreTheme(
    $colorBackground: String!
    $colorSurface: String!
    $colorPaper: String!
    $colorForeground: String!
    $colorMuted: String!
    $colorInk: String!
    $colorBorder: String!
    $colorBorderSubtle: String!
    $colorPrimary: String!
    $colorPrimaryDark: String!
    $colorPrimaryLight: String!
    $fontFamily: String!
    $layoutMode: String!
    $storeVertical: String!
    $tagline: String
    $themeZoneOverrides: String
  ) {
    updateStoreTheme(
      colorBackground: $colorBackground
      colorSurface: $colorSurface
      colorPaper: $colorPaper
      colorForeground: $colorForeground
      colorMuted: $colorMuted
      colorInk: $colorInk
      colorBorder: $colorBorder
      colorBorderSubtle: $colorBorderSubtle
      colorPrimary: $colorPrimary
      colorPrimaryDark: $colorPrimaryDark
      colorPrimaryLight: $colorPrimaryLight
      fontFamily: $fontFamily
      layoutMode: $layoutMode
      storeVertical: $storeVertical
      tagline: $tagline
      themeZoneOverrides: $themeZoneOverrides
    ) {
      ${STORE_SETTINGS_FIELDS}
    }
  }
`
