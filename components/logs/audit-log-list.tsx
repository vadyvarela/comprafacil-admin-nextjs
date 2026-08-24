"use client"

import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { AuditLog } from "@/lib/graphql/audit/types"
import { actionLabel, entityTypeLabel } from "@/lib/audit/labels"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type Props = {
  logs: AuditLog[]
}

function formatDate(iso: string): string {
  try {
    return format(new Date(iso), "dd/MM/yyyy HH:mm", { locale: ptBR })
  } catch {
    return "—"
  }
}

function actorLabel(log: AuditLog): string {
  if (log.actorName?.trim()) return log.actorName.trim()
  if (log.actorEmail?.trim()) return log.actorEmail.trim()
  return "—"
}

function entityHref(log: AuditLog): string | null {
  if (log.entityType === "CHECKOUT_SESSION") {
    return `/dashboard/orders/${log.entityId}`
  }
  if (log.entityType === "PRODUCT") {
    return `/dashboard/products/${log.entityId}`
  }
  if (log.entityType === "COUPON") {
    return `/dashboard/coupons`
  }
  return null
}

function shortId(id: string): string {
  if (!id || id.length < 8) return id
  return `${id.slice(0, 8)}…`
}

export function AuditLogList({ logs }: Props) {
  return (
    <div className="rounded-lg border border-border/80 overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-[11px] h-9">Data</TableHead>
            <TableHead className="text-[11px] h-9">Ação</TableHead>
            <TableHead className="text-[11px] h-9">Entidade</TableHead>
            <TableHead className="text-[11px] h-9">Actor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => {
            const href = entityHref(log)
            return (
              <TableRow key={log.id}>
                <TableCell className="text-xs tabular-nums text-muted-foreground whitespace-nowrap">
                  {formatDate(log.createdAt)}
                </TableCell>
                <TableCell className="text-xs font-medium">
                  {actionLabel(log.action)}
                </TableCell>
                <TableCell className="text-xs">
                  <span className="text-muted-foreground">
                    {entityTypeLabel(log.entityType)}{" "}
                  </span>
                  {href ? (
                    <Link
                      href={href}
                      className="font-mono text-[11px] text-foreground hover:underline"
                    >
                      {shortId(log.entityId)}
                    </Link>
                  ) : (
                    <span className="font-mono text-[11px]">
                      {shortId(log.entityId)}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {actorLabel(log)}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
