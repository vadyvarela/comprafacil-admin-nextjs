import Link from "next/link"
import {
  ArrowLeft,
  User,
  Calendar,
  Package,
  Info,
  CreditCard,
  MapPin,
  ExternalLink,
  Hash,
  Globe,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { formatCurrency } from "@/lib/utils/currency"
import type {
  CheckoutSessionDetailsResponse,
  OrderItemResponse,
  ShippingAddressFromMetadata,
} from "@/lib/graphql/orders/types"
import type { CustomerDetailsResponse } from "@/lib/graphql/customers/types"
import {
  getOrderStatusLabel,
  getOrderStatusClass,
} from "@/lib/orders/status"
import { OrderDetailActions } from "./order-detail-actions"
import { OrderFulfillmentStatus } from "./order-fulfillment-status"

type OrderDetailProps = {
  order: CheckoutSessionDetailsResponse
  customerDetails?: CustomerDetailsResponse | null
}

function formatAddressLine(addr: {
  address1?: string | null
  address2?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  country?: string | null
}): string[] {
  const lines: string[] = []
  if (addr.address1?.trim()) lines.push(addr.address1.trim())
  if (addr.address2?.trim()) lines.push(addr.address2.trim())
  const cityState = [addr.city, addr.state].filter(Boolean).join(", ")
  const zipCountry = [addr.zip, addr.country].filter(Boolean).join(" ")
  const loc = [cityState, zipCountry].filter(Boolean).join(" — ")
  if (loc) lines.push(loc)
  return lines
}

function getShippingAddressFromMetadata(
  metadata: string | null | undefined
): ShippingAddressFromMetadata | null {
  if (!metadata?.trim()) return null
  try {
    const parsed = JSON.parse(metadata) as {
      basePayload?: { shippingAddress?: ShippingAddressFromMetadata }
      shippingAddress?: ShippingAddressFromMetadata
    }
    const addr = parsed.basePayload?.shippingAddress ?? parsed.shippingAddress ?? null
    if (!addr || typeof addr !== "object") return null
    if (addr.address1 || addr.city || addr.zip || addr.country) return addr as ShippingAddressFromMetadata
    return null
  } catch {
    return null
  }
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-xs font-medium text-foreground text-right">{value}</span>
    </div>
  )
}

export function OrderDetail({ order, customerDetails }: OrderDetailProps) {
  const shippingFromMetadata = getShippingAddressFromMetadata(order.metadata)
  const totalLines =
    order.lines?.reduce(
      (sum: number, line: OrderItemResponse) => sum + line.quantity * line.unitAmount,
      0
    ) ?? 0
  const discount = order.amountDiscount ?? 0
  const total = Math.max(0, totalLines - discount)
  const currency = order.currency ?? "CVE"

  return (
    <div className="flex flex-1 flex-col min-h-0">
      {/* Sub-header */}
      <div className="border-b border-border bg-card/80 backdrop-blur">
        <div className="px-5 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Left: order ID + badges */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                <Package className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base font-bold font-mono tracking-tight text-foreground">
                    #{order.id.slice(0, 8)}
                  </h1>
                  {order.status && (
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getOrderStatusClass(order.status.code)}`}>
                      {getOrderStatusLabel(order.status.code)}
                    </span>
                  )}
                  {order.paymentProviderType && (
                    <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      {order.paymentProviderType}
                    </span>
                  )}
                </div>
                {order.createdAt && (
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(order.createdAt), "dd 'de' MMMM yyyy, HH:mm", { locale: ptBR })}
                  </p>
                )}
              </div>
            </div>
            {/* Right: actions */}
            <div className="flex items-center gap-2 shrink-0">
              <OrderDetailActions />
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" asChild>
                <Link href="/dashboard/orders">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Voltar
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 md:p-5">
        <div className="max-w-6xl mx-auto space-y-4">

          {/* Fulfillment status — full width, most prominent */}
          <OrderFulfillmentStatus
            orderId={order.id}
            fulfillmentStatus={order.fulfillmentStatus}
          />

          {/* Main grid */}
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Left column — info, customer, shipping */}
            <div className="space-y-4">
              {/* Order metadata */}
              <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-bold text-foreground uppercase tracking-wide">Informações</span>
                </div>
                <div className="px-4 py-1">
                  <InfoRow
                    label="ID completo"
                    value={<span className="font-mono text-[10px] break-all">{order.id}</span>}
                  />
                  {order.mode && <InfoRow label="Modo" value={order.mode} />}
                  {order.paymentMode && <InfoRow label="Modo pagamento" value={order.paymentMode} />}
                  {order.submitType && <InfoRow label="Tipo" value={order.submitType} />}
                  {order.currency && <InfoRow label="Moeda" value={order.currency} />}
                  {order.maximumNumberOfInstallments != null && (
                    <InfoRow label="Parcelas máx." value={order.maximumNumberOfInstallments} />
                  )}
                  {order.hasPaymentIntent != null && (
                    <InfoRow label="Tem pagamento" value={order.hasPaymentIntent ? "Sim" : "Não"} />
                  )}
                  {order.updatedAt && (
                    <InfoRow
                      label="Atualizado em"
                      value={format(new Date(order.updatedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    />
                  )}
                </div>
              </div>

              {/* Customer */}
              {order.customer && (
                <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-bold text-foreground uppercase tracking-wide">Cliente</span>
                  </div>
                  <div className="px-4 py-1">
                    {order.customer.name && (
                      <InfoRow label="Nome" value={<span className="font-semibold">{order.customer.name}</span>} />
                    )}
                    {order.customer.email && (
                      <InfoRow label="Email" value={<span className="break-all">{order.customer.email}</span>} />
                    )}
                    {order.customer.identifier && (
                      <InfoRow
                        label="Identificador"
                        value={<span className="font-mono text-[10px] break-all">{order.customer.identifier}</span>}
                      />
                    )}
                  </div>
                  {order.customer.id && (
                    <div className="px-4 pb-3">
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 w-full" asChild>
                        <Link href={`/dashboard/customers/${order.customer.id}`}>
                          <ExternalLink className="h-3 w-3" />
                          Ver perfil do cliente
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Shipping address */}
              {(shippingFromMetadata || order.customer?.id) && (
                <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-bold text-foreground uppercase tracking-wide">Endereço de entrega</span>
                  </div>
                  <div className="px-4 py-3">
                    {shippingFromMetadata ? (
                      <div className="space-y-0.5">
                        {formatAddressLine(shippingFromMetadata).map((line, i) => (
                          <p key={i} className="text-xs font-medium text-foreground">{line}</p>
                        ))}
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-muted-foreground mb-2">
                          Endereço não registado neste pedido.
                        </p>
                        {order.customer?.id && (
                          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 -ml-2" asChild>
                            <Link href={`/dashboard/customers/${order.customer.id}`}>
                              <ExternalLink className="h-3 w-3" />
                              Ver endereços do cliente
                            </Link>
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

              {/* URLs */}
              {(order.url || order.cancelUrl || order.returnUrl) && (
                <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
                    <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-bold text-foreground uppercase tracking-wide">URLs</span>
                  </div>
                  <div className="px-4 py-1">
                    {order.url && (
                      <InfoRow
                        label="URL"
                        value={
                          <a href={order.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                            <ExternalLink className="h-3 w-3" />
                            Abrir
                          </a>
                        }
                      />
                    )}
                    {order.cancelUrl && (
                      <InfoRow
                        label="URL cancelamento"
                        value={
                          <a href={order.cancelUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                            <ExternalLink className="h-3 w-3" />
                            Abrir
                          </a>
                        }
                      />
                    )}
                    {order.returnUrl && (
                      <InfoRow
                        label="URL retorno"
                        value={
                          <a href={order.returnUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                            <ExternalLink className="h-3 w-3" />
                            Abrir
                          </a>
                        }
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Raw metadata */}
              {order.metadata && (
                <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
                    <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-bold text-foreground uppercase tracking-wide">Metadata</span>
                  </div>
                  <div className="px-4 py-3">
                    <pre className="text-[10px] font-mono bg-muted/50 rounded-lg p-3 overflow-auto whitespace-pre-wrap break-all max-h-52 text-foreground">
                      {(() => {
                        try {
                          return JSON.stringify(JSON.parse(order.metadata!), null, 2)
                        } catch {
                          return order.metadata
                        }
                      })()}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Right column — items + payment */}
            <div className="lg:col-span-2 space-y-4">
              {/* Items */}
              <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
                  <Package className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-bold text-foreground uppercase tracking-wide">
                    Itens do pedido
                  </span>
                  {order.lines && order.lines.length > 0 && (
                    <span className="ml-auto text-xs font-medium text-muted-foreground">
                      {order.lines.length} item{order.lines.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                {order.lines && order.lines.length > 0 ? (
                  <div className="divide-y divide-border">
                    {order.lines.map((line: OrderItemResponse) => (
                      <div key={line.id} className="flex items-center gap-4 px-4 py-3.5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">
                            {line.productVariant?.product?.title ?? line.description ?? "Produto"}
                          </p>
                          {line.productVariant?.title && (
                            <p className="text-xs text-muted-foreground">{line.productVariant.title}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {line.quantity} × {formatCurrency(line.unitAmount, line.currency)}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-sm text-foreground">
                            {formatCurrency(line.quantity * line.unitAmount, line.currency)}
                          </p>
                          {line.status && (
                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium mt-1 ${getOrderStatusClass(line.status.code)}`}>
                              {getOrderStatusLabel(line.status.code)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-sm text-muted-foreground">
                    <Package className="h-8 w-8 mb-2 opacity-30" />
                    Nenhum item neste pedido.
                  </div>
                )}
              </div>

              {/* Payment summary */}
              <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
                  <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-bold text-foreground uppercase tracking-wide">Resumo do pagamento</span>
                </div>
                <div className="px-4 py-3 space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="tabular-nums font-medium text-foreground">{formatCurrency(totalLines, currency)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-emerald-600">
                      <span>Desconto</span>
                      <span className="tabular-nums font-medium">−{formatCurrency(discount, currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold text-foreground pt-2 border-t border-border">
                    <span>Total</span>
                    <span className="tabular-nums">{formatCurrency(total, currency)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  )
}
