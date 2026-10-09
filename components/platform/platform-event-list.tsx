"use client"

import { Fragment, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ChevronRight } from "lucide-react"
import type { PlatformEvent } from "@/lib/graphql/platform/types"
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

const EVENT_KIND_LABELS: Record<string, string> = {
  SYSTEM_ERROR: "Erro do sistema",
  PAYMENT_FAILED: "Pagamento falhado",
  PAYMENT_REVERSED: "Pagamento revertido",
  ORDER_NEEDS_ATTENTION: "Pedido requer atenção",
  LARGE_SALE: "Venda grande",
  STOCK_OUT: "Produto esgotado",
}

const LEVEL_STYLE: Record<string, { label: string; className: string }> = {
  ERROR: { label: "Erro", className: "bg-danger-soft text-danger-strong" },
  WARN: { label: "Aviso", className: "bg-warning-soft text-warning-strong" },
  INFO: { label: "Info", className: "bg-info-soft text-info-strong" },
}

function formatDate(iso: string, pattern = "dd/MM/yyyy HH:mm"): string {
  try {
    return format(new Date(iso), pattern, { locale: ptBR })
  } catch {
    return "—"
  }
}

function checkoutIdOf(event: PlatformEvent): string | null {
  const meta = event.metadata
  if (meta && typeof meta === "object" && "checkoutSessionId" in meta) {
    const id = (meta as { checkoutSessionId?: unknown }).checkoutSessionId
    return typeof id === "string" ? id : null
  }
  return null
}

export function PlatformEventList({ events }: { events: PlatformEvent[] }) {
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
            <TableHead className="text-xs h-9">Nível</TableHead>
            <TableHead className="text-xs h-9">Tipo</TableHead>
            <TableHead className="text-xs h-9">O que aconteceu</TableHead>
            <TableHead className="text-xs h-9">Loja</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => {
            const isOpen = expanded.has(event.id)
            const level = LEVEL_STYLE[event.level] ?? { label: event.level, className: "bg-muted" }
            const checkoutId = checkoutIdOf(event)
            return (
              <Fragment key={event.id}>
                <TableRow
                  className={cn("cursor-pointer", isOpen && "bg-muted/35")}
                  onClick={() => toggle(event.id)}
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
                    {formatDate(event.createdAt)}
                  </TableCell>
                  <TableCell>
                    <span className={cn("rounded px-1.5 py-0.5 text-[11px] font-semibold", level.className)}>
                      {level.label}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs whitespace-nowrap">
                    {EVENT_KIND_LABELS[event.kind] ?? event.kind}
                  </TableCell>
                  <TableCell className="text-xs font-medium max-w-md truncate">{event.title}</TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {event.storeName ?? "—"}
                  </TableCell>
                </TableRow>
                {isOpen ? (
                  <TableRow className="bg-muted/20 hover:bg-muted/20">
                    <TableCell colSpan={6} className="whitespace-normal px-4 py-3 text-xs">
                      <p className="mb-2 tabular-nums text-muted-foreground">
                        {formatDate(event.createdAt, "dd/MM/yyyy HH:mm:ss")}
                        {checkoutId ? (
                          <>
                            {" · "}
                            <Link
                              href={`/dashboard/orders/${checkoutId}`}
                              className="text-foreground hover:underline"
                            >
                              Ver pedido
                            </Link>
                          </>
                        ) : null}
                      </p>
                      {event.message ? (
                        <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-md border border-border/70 bg-background p-3 font-mono text-[11px]">
                          {event.message}
                        </pre>
                      ) : (
                        <p className="text-muted-foreground">Sem mais detalhes.</p>
                      )}
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
