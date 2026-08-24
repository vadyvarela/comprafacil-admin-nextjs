export type AuditActor = {
  id?: string | null
  email?: string | null
  name?: string | null
}

export type AuditLog = {
  id: string
  createdAt: string
  action: string
  entityType: string
  entityId: string
  actorId?: string | null
  actorEmail?: string | null
  actorName?: string | null
  metadata?: unknown
}

export type AuditLogPage = {
  data: AuditLog[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
}

export type AuditLogFilter = {
  action?: string | null
  entityType?: string | null
  entityId?: string | null
  actorEmail?: string | null
  dateFrom?: string | null
  dateTo?: string | null
  search?: string | null
}

export type PageInput = {
  page: number
  size: number
  sortBy?: string
  sortDirection?: string
}
