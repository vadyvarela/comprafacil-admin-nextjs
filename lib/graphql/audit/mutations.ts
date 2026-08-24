import { gql } from "@apollo/client"

export const CREATE_AUDIT_LOG = gql`
  mutation CreateAuditLog($input: CreateAuditLogInput!) {
    createAuditLog(input: $input) {
      id
      createdAt
      action
      entityType
      entityId
    }
  }
`
