import { gql } from "@apollo/client"

export const GET_TELEGRAM_NOTIFICATION_SETTINGS = gql`
  query GetTelegramNotificationSettings {
    telegramNotificationSettings {
      id
      enabled
      botTokenConfigured
      botTokenMasked
      chatIds
      updatedAt
    }
  }
`
