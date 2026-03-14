import Link from "next/link"
import {
  ArrowLeft,
  User,
  Calendar,
  Package,
  Info,
  CreditCard,
  MapPin,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  getOrderStatusVariant,
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

/** Extrai o endereço de entrega guardado no metadata da sessão (basePayload.shippingAddress). */
function getShippingAddressFromMetadata(
  metadata: string | null | undefined
): ShippingAddressFromMetadata | null {
  if (!metadata?.trim()) return null
  try {
    const parsed = JSON.parse(metadata) as {
      basePayload?: { shippingAddress?: ShippingAddressFromMetadata }
      shippingAddress?: ShippingAddressFromMetadata
    }
    const addr =
      parsed.basePayload?.shippingAddress ?? parsed.shippingAddress ?? null
    if (!addr || typeof addr !== "object") return null
    if (addr.address1 || addr.city || addr.zip || addr.country)
      return addr as ShippingAddressFromMetadata
    return null
  } catch {
    return null
  }
}

export function OrderDetail({ order, customerDetails }: OrderDetailProps) {
  const shippingFromMetadata = getShippingAddressFromMetadata(order.metadata)
  const totalLines =
    order.lines?.reduce(
      (sum: number, line: OrderItemResponse) =>
        sum + line.quantity * line.unitAmount,
      0
    ) ?? 0
  const discount = order.amountDiscount ?? 0
  const total = Math.max(0, totalLines - discount)
  const currency = order.currency ?? "CVE"

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <div className="border-b border-border bg-card">
        <div className="px-4 py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <h1 className="text-base font-semibold font-mono tracking-tight truncate">
                Pedido {order.id.slice(0, 8)}…
              </h1>
              {order.status ? (
                <Badge
                  variant={getOrderStatusVariant(order.status.code)}
                  className="text-xs shrink-0"
                >
                  {getOrderStatusLabel(order.status.code)}
                </Badge>
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )}
              {order.paymentProviderType && (
                <Badge variant="secondary" className="text-xs shrink-0">
                  {order.paymentProviderType}
                </Badge>
              )}
              {order.createdAt && (
                <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(order.createdAt), "dd MMM yyyy, HH:mm", {
                    locale: ptBR,
                  })}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <OrderDetailActions />
              <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
                <Link href="/dashboard/orders" className="inline-flex items-center">
                  <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                  Voltar
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-1 space-y-4">
            <div className="border border-border rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-3">
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">
                  Informações
                </span>
              </div>
              <div className="space-y-2.5 text-xs">
                <div>
                  <p className="text-muted-foreground mb-0.5">ID</p>
                  <p className="font-mono text-[10px] break-all">{order.id}</p>
                </div>
                {order.mode && (
                  <div>
                    <p className="text-muted-foreground mb-0.5">Modo</p>
                    <p className="font-medium">{order.mode}</p>
                  </div>
                )}
                {order.submitType && (
                  <div>
                    <p className="text-muted-foreground mb-0.5">Tipo</p>
                    <p className="font-medium">{order.submitType}</p>
                  </div>
                )}
                {order.maximumNumberOfInstallments != null && (
                  <div>
                    <p className="text-muted-foreground mb-0.5">Parcelas máx.</p>
                    <p className="font-medium">{order.maximumNumberOfInstallments}</p>
                  </div>
                )}
              </div>
            </div>

            <OrderFulfillmentStatus
              orderId={order.id}
              fulfillmentStatus={order.fulfillmentStatus}
            />

            {order.customer && (
              <div className="border border-border rounded-lg p-3">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">
                      Cliente
                    </span>
                  </div>
                  {order.customer.id && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                      <Link href={`/dashboard/customers/${order.customer.id}`}>
                        Ver cliente
                      </Link>
                    </Button>
                  )}
                </div>
                <div className="space-y-2.5 text-xs">
                  {order.customer.name && (
                    <div>
                      <p className="text-muted-foreground mb-0.5">Nome</p>
                      <p className="font-medium">{order.customer.name}</p>
                    </div>
                  )}
                  {order.customer.email && (
                    <div>
                      <p className="text-muted-foreground mb-0.5">Email</p>
                      <p className="font-medium break-all">{order.customer.email}</p>
                    </div>
                  )}
                  {order.customer.identifier && (
                    <div>
                      <p className="text-muted-foreground mb-0.5">Identificador</p>
                      <p className="font-mono text-[10px] break-all">
                        {order.customer.identifier}
                      </p>
                    </div>
                  )}
                  {order.customer.id && (
                    <div>
                      <p className="text-muted-foreground mb-0.5">ID cliente</p>
                      <p className="font-mono text-[10px] break-all">{order.customer.id}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(shippingFromMetadata || (order.customer && order.customer.id)) && (
              <div className="border border-border rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-3">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Endereço da compra
                  </span>
                </div>
                <div className="space-y-3 text-xs">
                  {shippingFromMetadata ? (
                    <p className="font-medium leading-snug">
                      {formatAddressLine(shippingFromMetadata).join(", ") ||
                        "—"}
                    </p>
                  ) : (
                    <>
                      <p className="text-muted-foreground">
                        Endereço escolhido pelo cliente não registado neste
                        pedido. O cliente pode selecionar o endereço na compra.
                      </p>
                      {order.customer?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs -ml-2"
                          asChild
                        >
                          <Link href={`/dashboard/customers/${order.customer.id}`}>
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

          <div className="lg:col-span-2 space-y-4">
            <div>
              <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Itens
              </h2>
              {order.lines && order.lines.length > 0 ? (
                <div className="space-y-0 border border-border rounded-lg overflow-hidden">
                  {order.lines.map((line: OrderItemResponse) => (
                    <div
                      key={line.id}
                      className="flex items-center justify-between gap-3 p-3 border-b last:border-b-0"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">
                          {line.productVariant?.product?.title ?? line.description}
                        </p>
                        {line.productVariant?.title && (
                          <p className="text-xs text-muted-foreground">
                            {line.productVariant.title}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {line.quantity} × {formatCurrency(line.unitAmount, line.currency)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-medium text-sm">
                          {formatCurrency(line.quantity * line.unitAmount, line.currency)}
                        </p>
                        {line.status && (
                          <Badge
                            variant={getOrderStatusVariant(line.status.code)}
                            className="text-[10px] mt-1"
                          >
                            {getOrderStatusLabel(line.status.code)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-border rounded-lg p-6 text-center text-sm text-muted-foreground">
                  Nenhum item neste pedido.
                </div>
              )}
            </div>

            <div className="border border-border rounded-lg p-3 bg-muted/30">
              <div className="flex items-center gap-1.5 mb-3">
                <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">
                  Resumo
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(totalLines, currency)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Desconto</span>
                    <span>-{formatCurrency(discount, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold pt-2 border-t">
                  <span>Total</span>
                  <span>{formatCurrency(total, currency)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
