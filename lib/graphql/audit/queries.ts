import { gql } from "@apollo/client"

export const AUDIT_LOGS = gql`
  query AuditLogs($filter: AuditLogFilterInput, $page: PageInput!) {
    auditLogs(filter: $filter, page: $page) {
      data {
        id
        createdAt
        action
        entityType
        entityId
        actorId
        actorEmail
        actorName
        metadata
      }
      pageNumber
      pageSize
      totalElements
      totalPages
    }
  }
`
