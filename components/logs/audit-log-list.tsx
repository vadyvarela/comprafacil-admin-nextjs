"use client"

import { Fragment, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ChevronRight } from "lucide-react"
import type { AuditLog } from "@/lib/graphql/audit/types"
import { actionLabel, entityTypeLabel } from "@/lib/audit/labels"
import {
  auditChanges,
  auditEntityName,
  auditExtraDetails,
  describeActor,
  describeAuditSummary,
} from "@/lib/audit/describe"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataPanel } from "@/components/admin/data-panel"
import { cn } from "@/lib/utils"

type Props = {
  logs: AuditLog[]
}

function formatDate(iso: string, pattern = "dd/MM/yyyy HH:mm"): string {
  try {
    return format(new Date(iso), pattern, { locale: ptBR })
  } catch {
    return "—"
  }
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

function AuditLogDetail({ log }: { log: AuditLog }) {
  const changes = auditChanges(log)
  const extras = auditExtraDetails(log)
  const actor = describeActor(log)
  const href = entityHref(log)

  return (
    <div className="grid gap-4 px-4 py-3 text-xs md:grid-cols-[1fr_16rem]">
      <div className="min-w-0 space-y-3">
        {changes.length > 0 ? (
          <table className="w-full table-fixed border-collapse">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="w-40 pb-1.5 font-medium">Campo</th>
                <th className="pb-1.5 font-medium">Antes</th>
                <th className="pb-1.5 font-medium">Depois</th>
              </tr>
            </thead>
            <tbody>
              {changes.map((c, i) => (
                <tr key={`${c.field}-${i}`} className="border-t border-border/60 align-top">
                  <td className="py-1.5 pr-3 font-medium">{c.field}</td>
                  <td className="py-1.5 pr-3 break-words text-muted-foreground line-through decoration-muted-foreground/40">
                    {c.from ?? "—"}
                  </td>
                  <td className="py-1.5 break-words">{c.to ?? (c.from ? "—" : "alterado")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-muted-foreground">
            {describeAuditSummary(log) ??
              "Sem detalhe de campos — eventos gravados antes desta versão só guardavam o nome."}
          </p>
        )}

        {extras.length > 0 ? (
          <dl className="grid grid-cols-[8rem_1fr] gap-x-3 gap-y-1">
            {extras.map((d) => (
              <Fragment key={d.label}>
                <dt className="text-muted-foreground">{d.label}</dt>
                <dd className="break-words">{d.value}</dd>
              </Fragment>
            ))}
          </dl>
        ) : null}
      </div>

      <dl className="grid h-fit grid-cols-[4.5rem_1fr] gap-x-3 gap-y-1 rounded-md border border-border/70 bg-background p-3">
        <dt className="text-muted-foreground">Quando</dt>
        <dd className="tabular-nums">{formatDate(log.createdAt, "dd/MM/yyyy HH:mm:ss")}</dd>
        <dt className="text-muted-foreground">Quem</dt>
        <dd className="break-words">
          {actor.label}
          {actor.hint ? <span className="block text-muted-foreground">{actor.hint}</span> : null}
        </dd>
        <dt className="text-muted-foreground">ID</dt>
        <dd className="break-all font-mono">
          {href ? (
            <Link href={href} className="hover:underline">
              {log.entityId}
            </Link>
          ) : (
            log.entityId
          )}
        </dd>
      </dl>
    </div>
  )
}

export function AuditLogList({ logs }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <DataPanel>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-muted/45">
            <TableHead className="w-8 h-9" />
            <TableHead className="text-xs h-9">Data</TableHead>
            <TableHead className="text-xs h-9">Ação</TableHead>
            <TableHead className="text-xs h-9">Entidade</TableHead>
            <TableHead className="text-xs h-9">Detalhes</TableHead>
            <TableHead className="text-xs h-9">Quem</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => {
            const href = entityHref(log)
            const isOpen = expanded.has(log.id)
            const name = auditEntityName(log)
            const summary = describeAuditSummary(log)
            const actor = describeActor(log)
            return (
              <Fragment key={log.id}>
                <TableRow
                  className={cn("cursor-pointer", isOpen && "bg-muted/35")}
                  onClick={() => toggle(log.id)}
                  aria-expanded={isOpen}
                >
                  <TableCell className="w-8 pr-0">
                    <ChevronRight
                      className={cn(
                        "size-3.5 text-muted-foreground transition-transform",
                        isOpen && "rotate-90"
                      )}
                    />
                  </TableCell>
                  <TableCell className="text-xs tabular-nums text-muted-foreground whitespace-nowrap">
                    {formatDate(log.createdAt)}
                  </TableCell>
                  <TableCell className="text-xs font-medium whitespace-nowrap">
                    {actionLabel(log.action)}
                  </TableCell>
                  <TableCell className="text-xs max-w-72">
                    <span className="text-muted-foreground">
                      {entityTypeLabel(log.entityType)}{" "}
                    </span>
                    {name ? <span className="font-medium">{name} </span> : null}
                    {href ? (
                      <Link
                        href={href}
                        onClick={(e) => e.stopPropagation()}
                        className="font-mono text-xs text-muted-foreground hover:text-foreground hover:underline"
                      >
                        {shortId(log.entityId)}
                      </Link>
                    ) : (
                      <span className="font-mono text-xs text-muted-foreground">
                        {shortId(log.entityId)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs max-w-80 truncate">
                    {summary ?? <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-xs whitespace-nowrap",
                      actor.identified ? "text-foreground" : "text-muted-foreground"
                    )}
                    title={actor.hint}
                  >
                    {actor.label}
                  </TableCell>
                </TableRow>
                {isOpen ? (
                  <TableRow className="bg-muted/20 hover:bg-muted/20">
                    <TableCell colSpan={6} className="p-0 whitespace-normal">
                      <AuditLogDetail log={log} />
                    </TableCell>
                  </TableRow>
                ) : null}
              </Fragment>
            )
          })}
        </TableBody>
      </Table>
    </DataPanel>
  )
}
