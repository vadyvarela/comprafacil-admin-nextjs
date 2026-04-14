"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import type { PaymentIntent } from "@/lib/graphql/transactions/types"
import { formatCurrency } from "@/lib/utils/currency"
import { invoicePdfHref, receiptPdfHref } from "@/lib/gateway-origin"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  CreditCard,
  User,
  Calendar,
  FileText,
  Receipt,
  Info,
  Hash,
  ExternalLink,
  Package,
} from "lucide-react"

type Props = {
  tx: PaymentIntent | null
  open: boolean
  onOpenChange: (open: boolean) => void
  gatewayOrigin?: string | null
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  try {
    return format(new Date(iso), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })
  } catch {
    return "—"
  }
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground shrink-0 min-w-[120px]">{label}</span>
      <span className="text-xs font-medium text-foreground text-right break-all">{value ?? "—"}</span>
    </div>
  )
}

function SectionTitle({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-muted/30">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-xs font-bold text-foreground uppercase tracking-wide">{title}</span>
    </div>
  )
}

function statusClass(code: string): string {
  const c = code?.toUpperCase() ?? ""
  if (["PS", "COMPLETED", "CAPTURED", "PAID"].some((x) => c.includes(x))) return "badge-success"
  if (["ERROR", "CANCELED", "FAILED", "REJECTED"].some((x) => c.includes(x))) return "badge-danger"
  if (c.includes("PENDING") || c.includes("PROCESSING")) return "badge-warning"
  if (c.includes("AUTHORIZED")) return "badge-info"
  return "badge-neutral"
}

function tryParseJson(raw: string | null | undefined | Record<string, unknown>): string {
  if (!raw) return "—"
  if (typeof raw === "object") return JSON.stringify(raw, null, 2)
  try {
    return JSON.stringify(JSON.parse(raw as string), null, 2)
  } catch {
    return String(raw)
  }
}

export function TransactionDetailSheet({ tx, open, onOpenChange, gatewayOrigin = null }: Props) {
  if (!tx) return null

  const invoicePdfLink =
    tx.invoice &&
    ((tx.invoice.url?.trim() ? tx.invoice.url : null) ||
      invoicePdfHref(gatewayOrigin, tx.invoice.id ?? null))
  const receiptPdfLink =
    tx.receipt &&
    ((tx.receipt.url?.trim() ? tx.receipt.url : null) ||
      receiptPdfHref(gatewayOrigin, tx.receipt.id ?? null))

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-full flex-col overflow-hidden p-0 sm:max-w-2xl"
      >
        {/* Header */}
        <div className="border-b border-border">
          <SheetHeader className="px-4 py-3">
            <SheetTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-4 w-4 text-primary" />
              Detalhes do Pagamento
            </SheetTitle>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <span className="font-mono text-xs text-muted-foreground break-all">{tx.id}</span>
              {tx.status && (
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusClass(tx.status.code)}`}>
                  {tx.status.code}
                </span>
              )}
            </div>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-auto">

          {/* Pagamento */}
          <div className="rounded-none border-b border-border">
            <SectionTitle icon={CreditCard} title="Pagamento" />
            <div className="px-4 py-1">
              <Row label="Valor" value={<span className="font-bold tabular-nums">{formatCurrency(tx.amount, tx.currency)}</span>} />
              <Row label="Moeda" value={tx.currency} />
              <Row
                label="Estado"
                value={
                  <div className="flex flex-col items-end gap-0.5">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusClass(tx.status?.code ?? "")}`}>
                      {tx.status?.code ?? "—"}
                    </span>
                    {tx.status?.description && (
                      <span className="text-[11px] text-muted-foreground">{tx.status.description}</span>
                    )}
                  </div>
                }
              />
              {tx.statusReason && <Row label="Motivo do estado" value={tx.statusReason} />}
              {tx.merchantReference && <Row label="Referência merchant" value={<span className="font-mono text-[11px]">{tx.merchantReference}</span>} />}
              {tx.description && <Row label="Descrição" value={tx.description} />}
              {tx.statementDescriptor && <Row label="Statement descriptor" value={tx.statementDescriptor} />}
              {tx.canceledReason && <Row label="Motivo cancelamento" value={tx.canceledReason} />}
            </div>
          </div>

          {/* Datas */}
          <div className="rounded-none border-b border-border">
            <SectionTitle icon={Calendar} title="Datas" />
            <div className="px-4 py-1">
              <Row label="Criado em" value={formatDate(tx.createdAt)} />
              <Row label="Atualizado em" value={formatDate(tx.updatedAt)} />
              {tx.authorizedAt && <Row label="Autorizado em" value={formatDate(tx.authorizedAt)} />}
              {tx.capturedAt && <Row label="Capturado em" value={formatDate(tx.capturedAt)} />}
              {tx.canceledAt && <Row label="Cancelado em" value={formatDate(tx.canceledAt)} />}
            </div>
          </div>

          {/* Cliente */}
          {tx.customer && (
            <div className="rounded-none border-b border-border">
              <SectionTitle icon={User} title="Cliente" />
              <div className="px-4 py-1">
                {tx.customer.name && <Row label="Nome" value={<span className="font-semibold">{tx.customer.name}</span>} />}
                {tx.customer.email && <Row label="Email" value={tx.customer.email} />}
                {tx.customer.phone && <Row label="Telefone" value={tx.customer.phone} />}
                {tx.customer.id && <Row label="ID" value={<span className="font-mono text-[10px]">{tx.customer.id}</span>} />}
              </div>
            </div>
          )}

          {/* Sessão de checkout */}
          {tx.checkoutSession && (
            <div className="rounded-none border-b border-border">
              <SectionTitle icon={Package} title="Sessão de checkout" />
              <div className="px-4 py-1">
                <Row label="ID" value={<span className="font-mono text-[10px]">{tx.checkoutSession.id}</span>} />
                {tx.checkoutSession.paymentMode && <Row label="Modo pagamento" value={tx.checkoutSession.paymentMode} />}
                {tx.checkoutSession.maximumNumberOfInstallments != null && (
                  <Row label="Parcelas máx." value={tx.checkoutSession.maximumNumberOfInstallments} />
                )}
                {tx.checkoutSession.amountDiscount != null && tx.checkoutSession.amountDiscount > 0 && (
                  <Row label="Desconto" value={formatCurrency(tx.checkoutSession.amountDiscount, tx.currency)} />
                )}
              </div>
              {/* Produtos */}
              {tx.checkoutSession.lines && tx.checkoutSession.lines.length > 0 && (
                <div className="px-4 pb-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Produtos</p>
                  <div className="space-y-2">
                    {tx.checkoutSession.lines.map((line, i) => (
                      <div key={i} className="rounded-lg border border-border bg-muted/20 px-3 py-2">
                        <p className="text-xs font-semibold text-foreground">
                          {line.productVariant?.product?.title ?? line.productVariant?.title ?? "Produto"}
                        </p>
                        {line.productVariant?.title && line.productVariant.product && (
                          <p className="text-[11px] text-muted-foreground">{line.productVariant.title}</p>
                        )}
                        <p className="text-[11px] text-muted-foreground mt-0.5">Qtde: {line.quantity}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Planos de parcelas */}
              {tx.checkoutSession.installmentPlans && tx.checkoutSession.installmentPlans.length > 0 && (
                <div className="px-4 pb-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Planos de parcelas</p>
                  <div className="space-y-1.5">
                    {tx.checkoutSession.installmentPlans.map((plan, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Parcela {i + 1}</span>
                        <span className="font-medium tabular-nums">
                          {formatCurrency(plan.amount, tx.currency)} — {formatDate(plan.dueDate)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Fatura */}
          {tx.invoice && (
            <div className="rounded-none border-b border-border">
              <SectionTitle icon={FileText} title="Fatura" />
              <div className="px-4 py-1">
                {tx.invoice.number && <Row label="Número" value={<span className="font-mono text-[11px]">{tx.invoice.number}</span>} />}
                <Row label="Total fatura" value={<span className="font-bold tabular-nums">{formatCurrency(tx.invoice.amountTotal, tx.invoice.currency)}</span>} />
                <Row label="Total pago" value={<span className="tabular-nums text-emerald-600 font-semibold">{formatCurrency(tx.invoice.amountPaid, tx.invoice.currency)}</span>} />
                {tx.invoice.dueDate && <Row label="Data de vencimento" value={formatDate(tx.invoice.dueDate)} />}
                {invoicePdfLink && (
                  <div className="py-2">
                    <a
                      href={invoicePdfLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-primary underline-offset-4 hover:underline inline-flex items-center gap-1.5"
                    >
                      <ExternalLink className="h-3 w-3 shrink-0" />
                      PDF da fatura
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recibo */}
          {tx.receipt && (
            <div className="rounded-none border-b border-border">
              <SectionTitle icon={Receipt} title="Recibo" />
              <div className="px-4 py-1">
                {tx.receipt.number && <Row label="Número" value={<span className="font-mono text-[11px]">{tx.receipt.number}</span>} />}
                {tx.receipt.sendTo && <Row label="Enviado para" value={tx.receipt.sendTo} />}
                {tx.receipt.sentAt && <Row label="Enviado em" value={formatDate(tx.receipt.sentAt)} />}
                {tx.receipt.deliveryStatus && <Row label="Estado entrega" value={tx.receipt.deliveryStatus} />}
                {receiptPdfLink && (
                  <div className="py-2">
                    <a
                      href={receiptPdfLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-primary underline-offset-4 hover:underline inline-flex items-center gap-1.5"
                    >
                      <ExternalLink className="h-3 w-3 shrink-0" />
                      PDF do recibo
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Caminho da fatura */}
          {tx.invoicePath && !tx.invoice && (
            <div className="rounded-none border-b border-border">
              <SectionTitle icon={FileText} title="Fatura" />
              <div className="px-4 py-1">
                <Row label="Caminho" value={<span className="font-mono text-[10px]">{tx.invoicePath}</span>} />
              </div>
            </div>
          )}

          {/* Metadata */}
          {tx.metadata && (
            <div className="rounded-none border-b border-border">
              <SectionTitle icon={Hash} title="Metadata" />
              <div className="px-4 py-3">
                <pre className="text-[10px] font-mono bg-muted/50 rounded-lg p-3 overflow-auto whitespace-pre-wrap break-all max-h-48 text-foreground">
                  {tryParseJson(tx.metadata)}
                </pre>
              </div>
            </div>
          )}

          {/* Response Metadata */}
          {tx.responseMetadata && (
            <div className="rounded-none border-b border-border">
              <SectionTitle icon={Info} title="Response Metadata" />
              <div className="px-4 py-3">
                <pre className="text-[10px] font-mono bg-muted/50 rounded-lg p-3 overflow-auto whitespace-pre-wrap break-all max-h-48 text-foreground">
                  {tryParseJson(tx.responseMetadata)}
                </pre>
              </div>
            </div>
          )}

        </div>
      </SheetContent>
    </Sheet>
  )
}
