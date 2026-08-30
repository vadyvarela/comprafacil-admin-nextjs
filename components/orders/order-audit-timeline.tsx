import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { History } from "lucide-react"
import type { AuditLog } from "@/lib/graphql/audit/types"
import { getFulfillmentStatusLabel } from "@/lib/orders/status"
import { DataPanel } from "@/components/admin/data-panel"
import { EmptyState } from "@/components/admin/empty-state"

type Props = {
  logs: AuditLog[]
  error?: string | null
}

function formatDate(iso: string): string {
  try {
    return format(new Date(iso), "dd/MM/yyyy HH:mm", { locale: ptBR })
  } catch {
    return iso
  }
}

function actorLabel(log: AuditLog): string {
  if (log.actorName?.trim()) return log.actorName.trim()
  if (log.actorEmail?.trim()) return log.actorEmail.trim()
  if (log.actorId?.trim()) return log.actorId.slice(0, 12)
  return "—"
}

function statusLabel(code: unknown): string {
  if (typeof code !== "string" || !code.trim()) return "—"
  return getFulfillmentStatusLabel(code)
}

function describeLog(log: AuditLog): string {
  if (log.action === "ORDER_FULFILLMENT_STATUS_CHANGED") {
    const meta = (log.metadata ?? {}) as { from?: string | null; to?: string | null }
    return `${statusLabel(meta.from)} → ${statusLabel(meta.to)}`
  }
  return log.action
}

export function OrderAuditTimeline({ logs, error }: Props) {
  return (
    <DataPanel>
      <div className="flex items-center justify-between border-b border-border bg-muted/35 px-4 py-3">
        <span className="text-xs font-bold text-foreground uppercase">
          Histórico
        </span>
      </div>
      <div className="p-4">
        {error ? (
          <p className="text-xs text-destructive">{error}</p>
        ) : logs.length === 0 ? (
          <EmptyState
            icon={History}
            title="Sem eventos"
            description="Alterações de estado aparecerão aqui."
            className="py-6"
          />
        ) : (
          <ol className="space-y-3">
            {logs.map((log) => (
              <li key={log.id} className="flex gap-3 text-xs">
                <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/40" />
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="font-medium text-foreground">{describeLog(log)}</p>
                  <p className="text-muted-foreground">
                    {formatDate(log.createdAt)} · {actorLabel(log)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </DataPanel>
  )
}
