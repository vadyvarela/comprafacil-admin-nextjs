import { gql } from "@apollo/client"

const TELEGRAM_NOTIFICATION_FIELDS = `
  id
  enabled
  botTokenConfigured
  botTokenMasked
  chatIds
  updatedAt
`

export const UPDATE_TELEGRAM_NOTIFICATION_SETTINGS = gql`
  mutation UpdateTelegramNotificationSettings(
    $botToken: String
    $chatIds: [String!]
  ) {
    updateTelegramNotificationSettings(botToken: $botToken, chatIds: $chatIds) {
      ${TELEGRAM_NOTIFICATION_FIELDS}
    }
  }
`
