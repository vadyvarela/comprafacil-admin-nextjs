import type { AuditLog } from "@/lib/graphql/audit/types"
import { getFulfillmentStatusLabel } from "@/lib/orders/status"

/** Uma alteração de campo, tal como o formulário a grava em `metadata.changes`. */
export type AuditFieldChange = {
  field: string
  from?: string | null
  to?: string | null
}

export type AuditActorView = {
  label: string
  /** Explicação curta para quando o autor não é uma pessoa identificada. */
  hint?: string
  identified: boolean
}

/**
 * Quem fez a acção, em linguagem de gente.
 *
 * Os nomes técnicos que a API grava (`master token (legado)`, `system`) não
 * dizem nada a quem está a ler o histórico da loja.
 */
export function describeActor(log: AuditLog): AuditActorView {
  const name = log.actorName?.trim()
  const email = log.actorEmail?.trim()

  if (email) {
    return { label: name && name !== "cliente" ? `${name} · ${email}` : email, identified: true }
  }
  if (name === "master token (legado)") {
    return {
      label: "Não identificado",
      hint: "Registado antes de o backoffice enviar a identidade de quem estava autenticado.",
      identified: false,
    }
  }
  if (name === "system") {
    return { label: "Sistema", hint: "Acção automática (ex.: pagamento confirmado).", identified: false }
  }
  if (name === "cliente") {
    return { label: "Cliente", identified: false }
  }
  if (name === "anónimo") {
    return { label: "Anónimo", identified: false }
  }
  if (name?.startsWith("token:")) {
    return { label: `Integração ${name.slice("token:".length)}`, identified: false }
  }
  if (name) return { label: name, identified: false }
  return { label: "—", identified: false }
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value)
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>
      }
    } catch {
      /* não é JSON */
    }
  }
  return {}
}

function text(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim()
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  return null
}

export function auditChanges(log: AuditLog): AuditFieldChange[] {
  const changes = asRecord(log.metadata).changes
  if (!Array.isArray(changes)) return []
  return changes
    .map((c) => asRecord(c))
    .filter((c) => typeof c.field === "string")
    .map((c) => ({ field: c.field as string, from: text(c.from), to: text(c.to) }))
}

const REASON_LABELS: Record<string, string> = {
  ORDER_PAID: "pagamento confirmado",
}

/** Nome legível do alvo (título do produto, nome do cupão), quando foi gravado. */
export function auditEntityName(log: AuditLog): string | null {
  const meta = asRecord(log.metadata)
  return text(meta.title) ?? text(meta.name)
}

/** Uma linha a resumir o que mudou. */
export function describeAuditSummary(log: AuditLog): string | null {
  const meta = asRecord(log.metadata)

  if (log.action === "ORDER_FULFILLMENT_STATUS_CHANGED") {
    const from = text(meta.from)
    const to = text(meta.to)
    const transition = `${from ? getFulfillmentStatusLabel(from) : "—"} → ${to ? getFulfillmentStatusLabel(to) : "—"}`
    const reason = text(meta.reason)
    return reason ? `${transition} (${REASON_LABELS[reason] ?? reason})` : transition
  }

  const changes = auditChanges(log)
  if (changes.length > 0) {
    const fields = changes.map((c) => c.field)
    return fields.length <= 3
      ? `Alterou ${fields.join(", ")}`
      : `Alterou ${fields.slice(0, 3).join(", ")} e mais ${fields.length - 3}`
  }
  if (log.action.endsWith("_UPDATED") && "changes" in meta) {
    return "Guardado sem alterações"
  }
  return null
}

const DETAIL_SKIP = new Set(["changes", "title", "name", "from", "to", "reason"])

const DETAIL_LABELS: Record<string, string> = {
  status: "Estado",
  condition: "Condição",
  category: "Categoria",
  brand: "Marca",
  quantity: "Stock inicial",
  sku: "SKU",
}

/** Restantes campos de `metadata`, para o painel de detalhe. */
export function auditExtraDetails(log: AuditLog): { label: string; value: string }[] {
  const meta = asRecord(log.metadata)
  return Object.entries(meta)
    .filter(([key]) => !DETAIL_SKIP.has(key))
    .map(([key, value]) => ({
      label: DETAIL_LABELS[key] ?? key,
      value: text(value) ?? JSON.stringify(value),
    }))
    .filter((d) => d.value && d.value !== "null")
}
