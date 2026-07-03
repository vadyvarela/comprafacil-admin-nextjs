export interface TelegramNotificationSettingsGql {
  id?: string | null
  enabled: boolean
  botTokenConfigured: boolean
  botTokenMasked?: string | null
  chatIds: string[]
  updatedAt?: string | null
}

export interface TelegramNotificationSettingsQueryData {
  telegramNotificationSettings: TelegramNotificationSettingsGql
}

export interface TelegramNotificationSettingsMutationData {
  updateTelegramNotificationSettings: TelegramNotificationSettingsGql
}
