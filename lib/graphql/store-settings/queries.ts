import { gql } from "@apollo/client"

const STORE_SETTINGS_FIELDS = `
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
  updatedAt
`

export const GET_STORE_SETTINGS = gql`
  query GetStoreSettings {
    storeSettings {
      ${STORE_SETTINGS_FIELDS}
    }
  }
`
