"use server"

import { getValidSession } from "@/lib/auth0"
import {
  canReadModule,
  canWriteModule,
} from "@/lib/auth/roles"
import { runGraphQL } from "./graphql"
import { AUDIT_LOGS } from "@/lib/graphql/audit/queries"
import { CREATE_AUDIT_LOG } from "@/lib/graphql/audit/mutations"
import type {
  AuditLog,
  AuditLogFilter,
  AuditLogPage,
  PageInput,
} from "@/lib/graphql/audit/types"

function actorFromSession(session: NonNullable<Awaited<ReturnType<typeof getValidSession>>>) {
  const user = session.user as {
    sub?: string | null
    email?: string | null
    name?: string | null
  }
  return {
    id: user.sub ?? null,
    email: user.email ?? null,
    name: user.name ?? null,
  }
}

function canRecordAudit(
  user: NonNullable<Awaited<ReturnType<typeof getValidSession>>>["user"]
): boolean {
  return (
    canWriteModule(user, "logs") ||
    canWriteModule(user, "products") ||
    canWriteModule(user, "coupons") ||
    canWriteModule(user, "orders")
  )
}

export type GetAuditLogsResult =
  | { ok: true; data: AuditLogPage }
  | { ok: false; error: string }

export async function getAuditLogs(params: {
  filter?: AuditLogFilter
  page?: PageInput
}): Promise<GetAuditLogsResult> {
  const session = await getValidSession()
  if (!session || !canReadModule(session.user, "logs")) {
    return { ok: false, error: "Sem permissão para ver logs." }
  }

  const result = await runGraphQL<{ auditLogs: AuditLogPage }>(AUDIT_LOGS, {
    filter: params.filter ?? null,
    page: params.page ?? {
      page: 0,
      size: 50,
      sortBy: "createdAt",
      sortDirection: "DESC",
    },
  })

  if (result.errors?.length) {
    return { ok: false, error: result.errors.map((e) => e.message).join("; ") }
  }
  const data = result.data?.auditLogs
  if (!data) return { ok: false, error: "Resposta inválida do servidor." }
  return { ok: true, data }
}

/** Timeline de uma encomenda — acessível a quem lê pedidos. */
export async function getOrderAuditLogs(
  orderId: string
): Promise<GetAuditLogsResult> {
  const session = await getValidSession()
  if (!session || !canReadModule(session.user, "orders")) {
    return { ok: false, error: "Sem permissão." }
  }

  const result = await runGraphQL<{ auditLogs: AuditLogPage }>(AUDIT_LOGS, {
    filter: {
      entityType: "CHECKOUT_SESSION",
      entityId: orderId,
    },
    page: {
      page: 0,
      size: 50,
      sortBy: "createdAt",
      sortDirection: "DESC",
    },
  })

  if (result.errors?.length) {
    return { ok: false, error: result.errors.map((e) => e.message).join("; ") }
  }
  const data = result.data?.auditLogs
  if (!data) return { ok: false, error: "Resposta inválida do servidor." }
  return { ok: true, data }
}

export type RecordAuditLogInput = {
  action: string
  entityType: string
  entityId: string
  metadata?: unknown
}

export type RecordAuditLogResult =
  | { ok: true; data: Pick<AuditLog, "id" | "createdAt" | "action" | "entityType" | "entityId"> }
  | { ok: false; error: string }

export async function recordAuditLog(
  input: RecordAuditLogInput
): Promise<RecordAuditLogResult> {
  const session = await getValidSession()
  if (!session || !canRecordAudit(session.user)) {
    return { ok: false, error: "Sem permissão." }
  }

  const actor = actorFromSession(session)

  const result = await runGraphQL<{
    createAuditLog: Pick<AuditLog, "id" | "createdAt" | "action" | "entityType" | "entityId">
  }>(CREATE_AUDIT_LOG, {
    input: {
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      actor,
      metadata: input.metadata ?? null,
    },
  })

  if (result.errors?.length) {
    return { ok: false, error: result.errors.map((e) => e.message).join("; ") }
  }
  const data = result.data?.createAuditLog
  if (!data) return { ok: false, error: "Resposta inválida do servidor." }
  return { ok: true, data }
}
