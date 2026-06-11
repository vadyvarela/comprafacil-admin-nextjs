import type { FontFamily, LayoutMode, StoreVertical } from "@/lib/store-presets"

export interface StoreSettingsGql {
  id?: string
  siteName: string
  siteDescription?: string | null
  logoUrl?: string | null
  faviconUrl?: string | null
  ogImageUrl?: string | null
  supportEmail?: string | null
  supportPhonePrimary?: string | null
  supportPhoneSecondary?: string | null
  address?: string | null
  facebookUrl?: string | null
  instagramUrl?: string | null
  whatsappNumber?: string | null
  colorBackground?: string | null
  colorSurface?: string | null
  colorPaper?: string | null
  colorForeground?: string | null
  colorMuted?: string | null
  colorInk?: string | null
  colorBorder?: string | null
  colorBorderSubtle?: string | null
  colorPrimary?: string | null
  colorPrimaryDark?: string | null
  colorPrimaryLight?: string | null
  fontFamily?: FontFamily | null
  layoutMode?: LayoutMode | null
  storeVertical?: StoreVertical | null
  tagline?: string | null
  themeZoneOverrides?: string | null
  updatedAt?: string | null
}

export interface StoreSettingsQueryData {
  storeSettings: StoreSettingsGql
}

export interface StoreSettingsMutationData {
  updateStoreSettings: StoreSettingsGql
}

export interface StoreThemeMutationData {
  updateStoreTheme: StoreSettingsGql
}
