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
  updatedAt?: string | null
}

export interface StoreSettingsQueryData {
  storeSettings: StoreSettingsGql
}

export interface StoreSettingsMutationData {
  updateStoreSettings: StoreSettingsGql
}
