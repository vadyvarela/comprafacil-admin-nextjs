import Link from "next/link"
import {
  ArrowLeft,
  User,
  Calendar,
  Package,
  CreditCard,
  FileText,
  Receipt,
  Hash,
  Info,
  ExternalLink,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  ShieldCheck,
  MapPin,
  Phone,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { formatCurrency } from "@/lib/utils/currency"
import type { PaymentIntent } from "@/lib/graphql/transactions/types"
import { invoicePdfHref, receiptPdfHref, ensurePdfExtension } from "@/lib/gateway-origin"

type TransactionDetailProps = {
  tx: PaymentIntent
  backHref?: string
  /** Origem do gateway (ex.: https://api.example.com) para link PDF quando `url` vem vazio */
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

function formatDateLong(iso: string | null | undefined): string {
  if (!iso) return "—"
  try {
    return format(new Date(iso), "dd 'de' MMMM yyyy, HH:mm", { locale: ptBR })
  } catch {
    return "—"
  }
}

function statusClass(code: string): string {
  const c = code?.toUpperCase() ?? ""
  if (["PS", "COMPLETED", "CAPTURED", "PAID"].some((x) => c.includes(x))) return "badge-success"
  if (["ERROR", "CANCELED", "FAILED", "REJECTED"].some((x) => c.includes(x))) return "badge-danger"
  if (c.includes("PENDING") || c.includes("PROCESSING")) return "badge-warning"
  if (c.includes("AUTHORIZED")) return "badge-info"
  return "badge-neutral"
}

function StatusIcon({ code }: { code: string }) {
  const c = code?.toUpperCase() ?? ""
  if (["PS", "COMPLETED", "CAPTURED", "PAID"].some((x) => c.includes(x)))
    return <CheckCircle2 className="h-5 w-5 text-emerald-500" />
  if (["ERROR", "CANCELED", "FAILED", "REJECTED"].some((x) => c.includes(x)))
    return <XCircle className="h-5 w-5 text-red-500" />
  if (c.includes("PENDING") || c.includes("PROCESSING"))
    return <Clock className="h-5 w-5 text-amber-500" />
  if (c.includes("AUTHORIZED"))
    return <ShieldCheck className="h-5 w-5 text-blue-500" />
  return <AlertCircle className="h-5 w-5 text-muted-foreground" />
}

function extractShippingAddress(metadata: string | null | undefined) {
  if (!metadata) return null
  try {
    const parsed = typeof metadata === "string" ? JSON.parse(metadata) : metadata
    return (parsed?.basePayload?.shippingAddress as Record<string, string> | null | undefined) ?? null
  } catch {
    return null
  }
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

const SISP_REQUEST_LABELS: Record<string, string> = {
  transactionCode: "Código de transação",
  posID: "POS ID",
  merchantRef: "Ref. merchant",
  merchantSession: "Sessão merchant",
  amount: "Valor",
  currency: "Moeda",
  is3DSec: "3D Secure",
  urlMerchantResponse: "URL resposta merchant",
  languageMessages: "Idioma",
  timeStamp: "Data/hora",
  fingerprintversion: "Versão fingerprint",
  fingerprint: "Fingerprint",
  purchaseRequest: "Purchase request (3DS)",
  token: "Token",
}

const SISP_RESPONSE_LABELS: Record<string, string> = {
  messageType: "Tipo de mensagem",
  merchantRef: "Ref. merchant",
  merchantSession: "Sessão merchant",
  userCancelled: "Cancelado pelo utilizador",
  merchantRespCP: "Código de processamento",
  merchantRespTid: "TID",
  merchantRespMerchantRef: "Ref. merchant (resp.)",
  merchantRespMerchantSession: "Sessão (resp.)",
  merchantRespPurchaseAmount: "Valor de compra",
  merchantRespMessageID: "ID da mensagem",
  merchantRespPan: "PAN",
  merchantResp: "Resposta",
  merchantRespTimeStamp: "Data/hora",
  merchantRespReferenceNumber: "Número de referência",
  merchantRespEntityCode: "Código de entidade",
  merchantRespClientReceipt: "Recibo do cliente",
  merchantRespErrorCode: "Código de erro",
  merchantRespErrorDescription: "Descrição do erro",
  merchantRespErrorDetail: "Detalhe do erro",
  merchantRespAdditionalErrorMessage: "Mensagem adicional",
  merchantRespReloadCode: "Código de recarga",
  resultFingerPrint: "Fingerprint",
  token: "Token",
  tokenDescription: "Descrição do token",
  maxAmountAllowed: "Valor máx. permitido",
  maxNumberOfTransactions: "Nº máx. transações",
  limitDate: "Data limite",
  approvalCode: "Código de aprovação",
}

function SispTable({ raw, labels }: { raw: string; labels: Record<string, string> }) {
  let parsed: Record<string, string> | null = null
  try {
    parsed = typeof raw === "string" ? JSON.parse(raw) : raw
  } catch {
    parsed = null
  }
  if (!parsed || typeof parsed !== "object") {
    return (
      <pre className="text-[10px] font-mono bg-muted/50 rounded-xl p-3 overflow-auto whitespace-pre-wrap break-all max-h-56 text-foreground leading-relaxed">
        {raw}
      </pre>
    )
  }
  const entries = Object.entries(parsed).filter(([, v]) => v != null && v !== "")
  return (
    <div className="px-4 py-1">
      {entries.map(([key, value]) => (
        <InfoRow
          key={key}
          label={labels[key] ?? key}
          value={<span className="font-mono text-[11px] break-all">{String(value)}</span>}
        />
      ))}
    </div>
  )
}


function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground shrink-0 min-w-[130px]">{label}</span>
      <span className="text-xs font-medium text-foreground text-right break-all">{value ?? "—"}</span>
    </div>
  )
}

function SectionCard({
  icon: Icon,
  title,
  badge,
  children,
}: {
  icon: React.ElementType
  title: string
  badge?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted">
          <Icon className="h-3 w-3 text-muted-foreground" />
        </div>
        <span className="text-xs font-semibold text-foreground">{title}</span>
        {badge && <span className="ml-auto">{badge}</span>}
      </div>
      {children}
    </div>
  )
}

function ReceiptStatusBadge({ status }: { status: string }) {
  const s = status?.toUpperCase() ?? ""
  if (s === "DELIVERED" || s === "SENT")
    return (
      <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium badge-success">
        {status}
      </span>
    )
  if (s === "FAILED" || s === "BOUNCED")
    return (
      <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium badge-danger">
        {status}
      </span>
    )
  return (
    <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium badge-neutral">
      {status}
    </span>
  )
}

export function TransactionDetail({
  tx,
  backHref = "/dashboard/transactions",
  gatewayOrigin = null,
}: TransactionDetailProps) {
  const invoicePdfLink =
    ensurePdfExtension(tx.invoice?.url?.trim() ? tx.invoice.url : null) ||
    invoicePdfHref(gatewayOrigin, tx.invoice?.id ?? null)
  const receiptPdfLink =
    ensurePdfExtension(tx.receipt?.url?.trim() ? tx.receipt.url : null) ||
    receiptPdfHref(gatewayOrigin, tx.receipt?.id ?? null)
  const discount = tx.checkoutSession?.amountDiscount ?? 0
  const hasInstallments =
    tx.checkoutSession?.installmentPlans &&
    tx.checkoutSession.installmentPlans.length > 0
  const hasLines =
    tx.checkoutSession?.lines && tx.checkoutSession.lines.length > 0

  return (
    <div className="flex flex-1 flex-col min-h-0 bg-grid">
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-5 py-6 md:px-6 space-y-5">

          {/* Hero */}
          <div className="animate-enter relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-emerald-500/[0.04] p-6">
            <div className="absolute inset-0 bg-grid opacity-30" />
            <div className="relative flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4 min-w-0">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20">
                  <CreditCard className="h-6 w-6 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap mb-1">
                    <h1 className="text-xl font-bold font-mono tracking-tight">
                      #{tx.id.slice(0, 8)}…
                    </h1>
                    {tx.status && (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusClass(tx.status.code)}`}
                      >
                        <StatusIcon code={tx.status.code} />
                        <span className="hidden sm:inline">{tx.status.description ?? tx.status.code}</span>
                      </span>
                    )}
                    {tx.checkoutSession?.paymentMode && (
                      <span className="inline-flex items-center rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {tx.checkoutSession.paymentMode}
                      </span>
                    )}
                  </div>
                  {tx.createdAt && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDateLong(tx.createdAt)}
                    </p>
                  )}
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold tabular-nums">{formatCurrency(tx.amount, tx.currency)}</span>
                    {discount > 0 && (
                      <span className="text-xs font-medium text-emerald-400">
                        −{formatCurrency(discount, tx.currency)} desc.
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" asChild>
                <Link href={backHref}>
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Voltar
                </Link>
              </Button>
            </div>
          </div>

          {(tx.createdAt || tx.authorizedAt || tx.capturedAt || tx.canceledAt) && (
            <div className="animate-enter-delay-1 rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-500/10">
                  <Calendar className="h-3 w-3 text-blue-400" />
                </div>
                <span className="text-xs font-semibold text-foreground">Linha do tempo</span>
              </div>
              <div className="px-4 py-3">
                <ol className="relative border-l border-border ml-3 space-y-4">
                  {tx.createdAt && (
                    <li className="pl-5 relative">
                      <span className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-muted border-2 border-border flex items-center justify-center">
                        <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                      </span>
                      <p className="text-xs font-semibold text-foreground">Criado</p>
                      <p className="text-[11px] text-muted-foreground tabular-nums">{formatDate(tx.createdAt)}</p>
                    </li>
                  )}
                  {tx.authorizedAt && (
                    <li className="pl-5 relative">
                      <span className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-blue-50 dark:bg-blue-950 border-2 border-blue-300 dark:border-blue-700 flex items-center justify-center">
                        <ShieldCheck className="h-2.5 w-2.5 text-blue-500" />
                      </span>
                      <p className="text-xs font-semibold text-foreground">Autorizado</p>
                      <p className="text-[11px] text-muted-foreground tabular-nums">{formatDate(tx.authorizedAt)}</p>
                    </li>
                  )}
                  {tx.capturedAt && (
                    <li className="pl-5 relative">
                      <span className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-emerald-50 dark:bg-emerald-950 border-2 border-emerald-300 dark:border-emerald-700 flex items-center justify-center">
                        <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />
                      </span>
                      <p className="text-xs font-semibold text-foreground">Capturado</p>
                      <p className="text-[11px] text-muted-foreground tabular-nums">{formatDate(tx.capturedAt)}</p>
                    </li>
                  )}
                  {tx.canceledAt && (
                    <li className="pl-5 relative">
                      <span className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-red-50 dark:bg-red-950 border-2 border-red-300 dark:border-red-700 flex items-center justify-center">
                        <XCircle className="h-2.5 w-2.5 text-red-500" />
                      </span>
                      <p className="text-xs font-semibold text-foreground">Cancelado</p>
                      <p className="text-[11px] text-muted-foreground tabular-nums">{formatDate(tx.canceledAt)}</p>
                      {tx.canceledReason && (
                        <p className="text-[11px] text-red-500 mt-0.5">Motivo: {tx.canceledReason}</p>
                      )}
                    </li>
                  )}
                  {tx.updatedAt && tx.updatedAt !== tx.createdAt && (
                    <li className="pl-5 relative">
                      <span className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-muted border-2 border-border flex items-center justify-center">
                        <Info className="h-2.5 w-2.5 text-muted-foreground" />
                      </span>
                      <p className="text-xs font-semibold text-foreground">Última atualização</p>
                      <p className="text-[11px] text-muted-foreground tabular-nums">{formatDate(tx.updatedAt)}</p>
                    </li>
                  )}
                </ol>
              </div>
            </div>
          )}

          <div className="grid gap-5 lg:grid-cols-3 animate-enter-delay-2">

            {/* ── Left column ── */}
            <div className="space-y-4">

              {/* Informações */}
              <SectionCard icon={Info} title="Informações">
                <div className="px-4 py-1">
                  <InfoRow
                    label="ID completo"
                    value={
                      <span className="font-mono text-[10px] break-all select-all">{tx.id}</span>
                    }
                  />
                  {tx.merchantReference && (
                    <InfoRow
                      label="Ref. merchant"
                      value={<span className="font-mono text-[11px]">{tx.merchantReference}</span>}
                    />
                  )}
                  <InfoRow label="Moeda" value={tx.currency} />
                  {tx.description && <InfoRow label="Descrição" value={tx.description} />}
                  {tx.statementDescriptor && (
                    <InfoRow label="Statement descriptor" value={tx.statementDescriptor} />
                  )}
                  {tx.statusReason && (
                    <InfoRow label="Motivo do estado" value={tx.statusReason} />
                  )}
                  {tx.checkoutSession?.paymentMode && (
                    <InfoRow label="Modo pagamento" value={tx.checkoutSession.paymentMode} />
                  )}
                  {tx.checkoutSession?.maximumNumberOfInstallments != null && (
                    <InfoRow
                      label="Parcelas máx."
                      value={tx.checkoutSession.maximumNumberOfInstallments}
                    />
                  )}
                  {tx.checkoutSession?.id && (
                    <InfoRow
                      label="Sessão checkout"
                      value={
                        <span className="font-mono text-[10px] break-all">{tx.checkoutSession.id}</span>
                      }
                    />
                  )}
                </div>
              </SectionCard>

              {/* Cliente */}
              {tx.customer && (
                <SectionCard icon={User} title="Cliente">
                  <div className="px-4 py-1">
                    {tx.customer.name && (
                      <InfoRow
                        label="Nome"
                        value={<span className="font-semibold">{tx.customer.name}</span>}
                      />
                    )}
                    {tx.customer.email && (
                      <InfoRow
                        label="Email"
                        value={<span className="break-all">{tx.customer.email}</span>}
                      />
                    )}
                    {tx.customer.phone && (
                      <InfoRow label="Telefone" value={tx.customer.phone} />
                    )}
                    {tx.customer.id && (
                      <InfoRow
                        label="ID"
                        value={
                          <span className="font-mono text-[10px] break-all">{tx.customer.id}</span>
                        }
                      />
                    )}
                  </div>
                  {tx.customer.id && (
                    <div className="px-4 pb-3">
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 w-full" asChild>
                        <Link href={`/dashboard/customers/${tx.customer.id}`}>
                          <ExternalLink className="h-3 w-3" />
                          Ver perfil do cliente
                        </Link>
                      </Button>
                    </div>
                  )}
                </SectionCard>
              )}

              {/* Endereço de entrega */}
              {(() => {
                const addr = extractShippingAddress(tx.checkoutSession?.metadata)
                const phone = addr?.phone ?? tx.customer?.phone
                if (!addr && !phone) return null
                return (
                  <SectionCard icon={MapPin} title="Endereço de entrega">
                    <div className="px-4 py-1">
                      {addr?.address1 && <InfoRow label="Rua" value={addr.address1} />}
                      {addr?.address2 && <InfoRow label="Complemento" value={addr.address2} />}
                      {addr?.city && <InfoRow label="Cidade" value={addr.city} />}
                      {addr?.state && <InfoRow label="Estado" value={addr.state} />}
                      {(addr?.zip || addr?.postalCode) && (
                        <InfoRow label="Código postal" value={addr.zip ?? addr.postalCode} />
                      )}
                      {addr?.country && <InfoRow label="País" value={addr.country} />}
                      {phone && (
                        <InfoRow
                          label="Telefone"
                          value={
                            <span className="inline-flex items-center gap-1">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {phone}
                            </span>
                          }
                        />
                      )}
                    </div>
                  </SectionCard>
                )
              })()}
            </div>

            {/* ── Right column (2/3) ── */}
            <div className="lg:col-span-2 space-y-4">

              {/* Produtos */}
              {hasLines && (
                <SectionCard
                  icon={Package}
                  title="Produtos"
                  badge={
                    <span className="text-xs font-medium text-muted-foreground">
                      {tx.checkoutSession!.lines.length} item{tx.checkoutSession!.lines.length !== 1 ? "s" : ""}
                    </span>
                  }
                >
                  <div className="divide-y divide-border">
                    {tx.checkoutSession!.lines.map((line, i) => (
                      <div key={i} className="flex items-center gap-4 px-4 py-3.5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted overflow-hidden">
                          {line.productVariant?.image || line.productVariant?.product?.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={line.productVariant.image ?? line.productVariant.product?.image ?? ""}
                              alt={line.productVariant?.product?.title ?? "Produto"}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">
                            {line.productVariant?.product?.title ?? line.productVariant?.title ?? "Produto"}
                          </p>
                          {line.productVariant?.title && line.productVariant.product && (
                            <p className="text-xs text-muted-foreground">{line.productVariant.title}</p>
                          )}
                          {line.productVariant?.description && (
                            <p className="text-xs text-muted-foreground truncate">{line.productVariant.description}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-muted-foreground">Qtde</p>
                          <p className="font-bold text-sm text-foreground tabular-nums">{line.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              )}

              {/* Resumo financeiro */}
              <SectionCard icon={CreditCard} title="Resumo financeiro">
                <div className="px-4 py-3 space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Valor cobrado</span>
                    <span className="tabular-nums font-semibold text-foreground">{formatCurrency(tx.amount, tx.currency)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-emerald-400">
                      <span>Desconto</span>
                      <span className="tabular-nums font-medium">−{formatCurrency(discount, tx.currency)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-base font-bold text-foreground pt-1">
                    <span>Total</span>
                    <span className="tabular-nums">{formatCurrency(tx.amount, tx.currency)}</span>
                  </div>
                </div>
              </SectionCard>

              {/* Plano de parcelas */}
              {hasInstallments && (
                <SectionCard
                  icon={Calendar}
                  title="Plano de parcelas"
                  badge={
                    <span className="text-xs font-medium text-muted-foreground">
                      {tx.checkoutSession!.installmentPlans.length} parcela{tx.checkoutSession!.installmentPlans.length !== 1 ? "s" : ""}
                    </span>
                  }
                >
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border bg-muted/20">
                          <th className="px-4 py-2 text-left text-muted-foreground font-semibold">#</th>
                          <th className="px-4 py-2 text-right text-muted-foreground font-semibold">Valor</th>
                          <th className="px-4 py-2 text-right text-muted-foreground font-semibold">Vencimento</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {tx.checkoutSession!.installmentPlans.map((plan, i) => (
                          <tr key={i} className="hover:bg-muted/20 transition-colors">
                            <td className="px-4 py-2.5 text-muted-foreground font-mono">{i + 1}ª</td>
                            <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-foreground">
                              {formatCurrency(plan.amount, tx.currency)}
                            </td>
                            <td className="px-4 py-2.5 text-right text-muted-foreground tabular-nums">
                              {formatDate(plan.dueDate)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-border bg-muted/30">
                          <td className="px-4 py-2.5 text-xs font-bold text-foreground">Total</td>
                          <td className="px-4 py-2.5 text-right text-xs font-bold tabular-nums text-foreground">
                            {formatCurrency(
                              tx.checkoutSession!.installmentPlans.reduce((s, p) => s + p.amount, 0),
                              tx.currency
                            )}
                          </td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </SectionCard>
              )}

              {/* Fatura */}
              <SectionCard icon={FileText} title="Fatura">
                {tx.invoice ? (
                  <>
                    <div className="px-4 py-1">
                      {tx.invoice.number && (
                        <InfoRow
                          label="Número"
                          value={<span className="font-mono text-[11px]">{tx.invoice.number}</span>}
                        />
                      )}
                      <InfoRow
                        label="Total fatura"
                        value={
                          <span className="font-bold tabular-nums">
                            {formatCurrency(tx.invoice.amountTotal, tx.invoice.currency)}
                          </span>
                        }
                      />
                      <InfoRow
                        label="Total pago"
                        value={
                          <span className="tabular-nums text-emerald-400 font-bold">
                            {formatCurrency(tx.invoice.amountPaid, tx.invoice.currency)}
                          </span>
                        }
                      />
                      <InfoRow label="Moeda" value={tx.invoice.currency} />
                      {tx.invoice.dueDate && (
                        <InfoRow label="Vencimento" value={formatDate(tx.invoice.dueDate)} />
                      )}
                    </div>
                    {invoicePdfLink ? (
                      <div className="px-4 pb-3 pt-2">
                        <a
                          href={invoicePdfLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-primary underline-offset-4 hover:underline inline-flex items-center gap-1.5"
                        >
                          <FileText className="h-3.5 w-3.5 shrink-0" />
                          PDF da fatura
                          <ExternalLink className="h-3 w-3 opacity-70" />
                        </a>
                      </div>
                    ) : tx.invoicePath ? (
                      <div className="px-4 pb-3">
                        <InfoRow
                          label="Caminho"
                          value={<span className="font-mono text-[10px] break-all">{tx.invoicePath}</span>}
                        />
                      </div>
                    ) : null}
                  </>
                ) : tx.invoicePath ? (
                  <div className="px-4 py-1">
                    <InfoRow
                      label="Caminho"
                      value={<span className="font-mono text-[10px] break-all">{tx.invoicePath}</span>}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-5 px-4 text-center gap-2">
                    <FileText className="h-7 w-7 text-muted-foreground/40" />
                    <p className="text-xs text-muted-foreground">Fatura não disponível para esta transação.</p>
                  </div>
                )}
              </SectionCard>

              {/* Recibo */}
              <SectionCard icon={Receipt} title="Recibo">
                {tx.receipt ? (
                  <>
                    <div className="px-4 py-1">
                      {tx.receipt.number && (
                        <InfoRow
                          label="Número"
                          value={<span className="font-mono text-[11px]">{tx.receipt.number}</span>}
                        />
                      )}
                      {tx.receipt.sendTo && (
                        <InfoRow
                          label="Enviado para"
                          value={<span className="break-all">{tx.receipt.sendTo}</span>}
                        />
                      )}
                      {tx.receipt.sentAt && (
                        <InfoRow label="Enviado em" value={formatDate(tx.receipt.sentAt)} />
                      )}
                      {tx.receipt.deliveryStatus && (
                        <InfoRow
                          label="Estado de entrega"
                          value={<ReceiptStatusBadge status={tx.receipt.deliveryStatus} />}
                        />
                      )}
                    </div>
                    {receiptPdfLink && (
                      <div className="px-4 pb-3 pt-2">
                        <a
                          href={receiptPdfLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-primary underline-offset-4 hover:underline inline-flex items-center gap-1.5"
                        >
                          <Receipt className="h-3.5 w-3.5 shrink-0" />
                          PDF do recibo
                          <ExternalLink className="h-3 w-3 opacity-70" />
                        </a>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-5 px-4 text-center gap-2">
                    <Receipt className="h-7 w-7 text-muted-foreground/40" />
                    <p className="text-xs text-muted-foreground">Recibo não disponível para esta transação.</p>
                  </div>
                )}
              </SectionCard>
            </div>
          </div>

          {/* ── SISP + Metadata ── */}
          {(tx.sispRequest || tx.responseMetadata || tx.metadata) && (
            <div className="grid gap-4 sm:grid-cols-2">
              {tx.sispRequest && (
                <SectionCard icon={Hash} title="SISP Request">
                  <SispTable raw={tx.sispRequest} labels={SISP_REQUEST_LABELS} />
                </SectionCard>
              )}
              {tx.responseMetadata && (
                <SectionCard icon={Info} title="SISP Response">
                  <SispTable raw={tx.responseMetadata} labels={SISP_RESPONSE_LABELS} />
                </SectionCard>
              )}
              {tx.metadata && (
                <SectionCard icon={Hash} title="Metadata">
                  <div className="px-4 py-3">
                    <pre className="text-[10px] font-mono bg-muted/50 rounded-xl p-3 overflow-auto whitespace-pre-wrap break-all max-h-56 text-foreground leading-relaxed">
                      {tryParseJson(tx.metadata)}
                    </pre>
                  </div>
                </SectionCard>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
