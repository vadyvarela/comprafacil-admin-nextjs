"use client"

import { Fragment, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ChevronRight } from "lucide-react"
import type { PlatformTransaction } from "@/lib/graphql/platform/types"
import { formatCurrency, minorToMajorCurrencyAmount } from "@/lib/utils/currency"
import { getFulfillmentStatusLabel } from "@/lib/orders/status"
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

function money(minor: number, currency: string): string {
  return formatCurrency(minorToMajorCurrencyAmount(minor), currency)
}

function formatDate(iso: string | null | undefined, pattern = "dd/MM/yyyy HH:mm"): string {
  if (!iso) return "—"
  try {
    return format(new Date(iso), pattern, { locale: ptBR })
  } catch {
    return "—"
  }
}

const STATUS_TONE: Record<string, string> = {
  PS: "text-success-strong",
  PF: "text-danger-strong",
  PC: "text-muted-foreground",
}

function TransactionDetail({ tx }: { tx: PlatformTransaction }) {
  const itemsTotal = tx.items.reduce((sum, i) => sum + i.unitAmount * i.quantity, 0)

  return (
    <div className="grid gap-4 px-4 py-3 text-xs md:grid-cols-[1fr_18rem]">
      <div className="min-w-0 space-y-3">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="pb-1.5 font-medium">Artigo</th>
              <th className="w-14 pb-1.5 text-right font-medium">Qtd.</th>
              <th className="w-28 pb-1.5 text-right font-medium">Preço</th>
              <th className="w-28 pb-1.5 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {tx.items.map((item, i) => (
              <tr key={i} className="border-t border-border/60">
                <td className="py-1.5 pr-3">{item.description}</td>
                <td className="py-1.5 text-right tabular-nums">{item.quantity}</td>
                <td className="py-1.5 text-right tabular-nums">{money(item.unitAmount, tx.currency)}</td>
                <td className="py-1.5 text-right tabular-nums">
                  {money(item.unitAmount * item.quantity, tx.currency)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="tabular-nums">
            <tr className="border-t border-border/60">
              <td colSpan={3} className="pt-1.5 text-right text-muted-foreground">Artigos</td>
              <td className="pt-1.5 text-right">{money(itemsTotal, tx.currency)}</td>
            </tr>
            {tx.discountAmount > 0 ? (
              <tr>
                <td colSpan={3} className="text-right text-muted-foreground">Desconto</td>
                <td className="text-right">−{money(tx.discountAmount, tx.currency)}</td>
              </tr>
            ) : null}
            <tr>
              <td colSpan={3} className="text-right text-muted-foreground">Envio</td>
              <td className="text-right">{money(tx.shippingAmount, tx.currency)}</td>
            </tr>
            <tr className="font-semibold">
              <td colSpan={3} className="text-right">Pago pelo cliente</td>
              <td className="text-right">{money(tx.amount, tx.currency)}</td>
            </tr>
            <tr className="font-semibold text-success-strong">
              <td colSpan={3} className="text-right">A tua comissão</td>
              <td className="text-right">{money(tx.commission, tx.currency)}</td>
            </tr>
          </tfoot>
        </table>
        {tx.statusReason ? (
          <p className="text-muted-foreground">
            Motivo: <span className="text-foreground">{tx.statusReason}</span>
          </p>
        ) : null}
      </div>

      <dl className="grid h-fit grid-cols-[5.5rem_1fr] gap-x-3 gap-y-1 rounded-md border border-border/70 bg-background p-3">
        <dt className="text-muted-foreground">Cliente</dt>
        <dd className="break-words">{tx.customerName ?? "—"}</dd>
        <dt className="text-muted-foreground">Email</dt>
        <dd className="break-all">{tx.customerEmail ?? "—"}</dd>
        <dt className="text-muted-foreground">Telefone</dt>
        <dd>{tx.customerPhone ?? "—"}</dd>
        <dt className="text-muted-foreground">Cartão</dt>
        <dd>
          {tx.cardBrand || tx.cardLast4
            ? `${tx.cardBrand ?? ""} ${tx.cardLast4 ? `•••• ${tx.cardLast4}` : ""}`.trim()
            : "—"}
        </dd>
        <dt className="text-muted-foreground">Iniciado</dt>
        <dd className="tabular-nums">{formatDate(tx.createdAt, "dd/MM/yyyy HH:mm:ss")}</dd>
        <dt className="text-muted-foreground">Pago</dt>
        <dd className="tabular-nums">{formatDate(tx.capturedAt, "dd/MM/yyyy HH:mm:ss")}</dd>
        <dt className="text-muted-foreground">Envio</dt>
        <dd>{tx.fulfillmentStatus ? getFulfillmentStatusLabel(tx.fulfillmentStatus) : "—"}</dd>
        <dt className="text-muted-foreground">Loja</dt>
        <dd>{tx.storeName ?? "—"}</dd>
        <dt className="text-muted-foreground">Pedido</dt>
        <dd className="break-all font-mono">
          <Link href={`/dashboard/orders/${tx.checkoutSessionId}`} className="hover:underline">
            {tx.checkoutSessionId}
          </Link>
        </dd>
      </dl>
    </div>
  )
}

export function PlatformTransactionList({ transactions }: { transactions: PlatformTransaction[] }) {
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
            <TableHead className="text-xs h-9">Referência</TableHead>
            <TableHead className="text-xs h-9">Cliente</TableHead>
            <TableHead className="text-xs h-9">Estado</TableHead>
            <TableHead className="text-xs h-9 text-right">Valor</TableHead>
            <TableHead className="text-xs h-9 text-right">Comissão</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => {
            const isOpen = expanded.has(tx.id)
            return (
              <Fragment key={tx.id}>
                <TableRow
                  className={cn("cursor-pointer", isOpen && "bg-muted/35")}
                  onClick={() => toggle(tx.id)}
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
                    {formatDate(tx.capturedAt ?? tx.createdAt)}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{tx.merchantReference}</TableCell>
                  <TableCell className="text-xs max-w-56 truncate">
                    {tx.customerName ?? tx.customerEmail ?? "—"}
                  </TableCell>
                  <TableCell className={cn("text-xs whitespace-nowrap", STATUS_TONE[tx.status])}>
                    {tx.statusLabel}
                  </TableCell>
                  <TableCell className="text-xs text-right tabular-nums whitespace-nowrap">
                    {money(tx.amount, tx.currency)}
                  </TableCell>
                  <TableCell className="text-xs text-right tabular-nums font-semibold whitespace-nowrap">
                    {tx.commission > 0 ? money(tx.commission, tx.currency) : "—"}
                  </TableCell>
                </TableRow>
                {isOpen ? (
                  <TableRow className="bg-muted/20 hover:bg-muted/20">
                    <TableCell colSpan={7} className="p-0 whitespace-normal">
                      <TransactionDetail tx={tx} />
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
