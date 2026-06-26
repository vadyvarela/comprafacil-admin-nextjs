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
  nif
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
  productPageTrustBadges
  productPageLayout
  updatedAt
`

export const GET_STORE_SETTINGS = gql`
  query GetStoreSettings {
    storeSettings {
      ${STORE_SETTINGS_FIELDS}
    }
  }
`
