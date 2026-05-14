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
  Phone,
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
import type {
  AddressResponse,
  CustomerDetailsResponse,
} from "@/lib/graphql/customers/types"
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

function phoneFromAddressLegacy(metadata: string | null | undefined): string | null {
  if (!metadata?.trim()) return null
  try {
    const o = JSON.parse(metadata) as { phone?: string }
    const p = o?.phone
    return typeof p === "string" && p.trim() ? p.trim() : null
  } catch {
    return null
  }
}

function addressToShippingView(addr: AddressResponse): ShippingAddressFromMetadata {
  const phone =
    (typeof addr.phone === "string" && addr.phone.trim() ? addr.phone.trim() : null) ??
    phoneFromAddressLegacy(addr.metadata)
  return {
    address1: addr.address1 ?? null,
    address2: addr.address2 ?? null,
    city: addr.city ?? null,
    state: addr.state ?? null,
    zip: addr.zip ?? null,
    country: addr.country ?? null,
    phone,
  }
}

function resolveDisplayShipping(
  sessionAddr: ShippingAddressFromMetadata | null,
  customerDetails: CustomerDetailsResponse | null | undefined
): { source: "session" | "profile"; addr: ShippingAddressFromMetadata } | null {
  if (
    sessionAddr &&
    (sessionAddr.address1?.trim() ||
      sessionAddr.city?.trim() ||
      sessionAddr.zip?.trim() ||
      sessionAddr.country?.trim() ||
      sessionAddr.phone?.trim())
  ) {
    return { source: "session", addr: sessionAddr }
  }
  const list = customerDetails?.addresses
  if (!list?.length) return null
  const pick = list.find((a) => a.isDefault) ?? list[0]
  return { source: "profile", addr: addressToShippingView(pick) }
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
    const s = addr as ShippingAddressFromMetadata
    if (s.address1 || s.city || s.zip || s.country || s.phone?.trim()) return s
    return null
  } catch {
    return null
  }
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-border/50 last:border-0">
      <span className="text-[11px] text-muted-foreground shrink-0">{label}</span>
      <span className="text-xs font-medium text-foreground text-right">{value}</span>
    </div>
  )
}

function SectionCard({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  badge,
  children,
}: {
  icon: React.ElementType
  iconBg?: string
  iconColor?: string
  title: string
  badge?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-border/80 bg-card overflow-hidden shadow-none">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/80 bg-muted/25">
        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border/50 ${iconBg ?? "bg-muted/50"}`}>
          <Icon className={`h-3.5 w-3.5 ${iconColor ?? "text-muted-foreground"}`} />
        </div>
        <span className="text-xs font-medium text-foreground">{title}</span>
        {badge && <span className="ml-auto">{badge}</span>}
      </div>
      {children}
    </div>
  )
}

export function OrderDetail({ order, customerDetails }: OrderDetailProps) {
  const shippingFromMetadata = getShippingAddressFromMetadata(order.metadata)
  const displayShipping = resolveDisplayShipping(shippingFromMetadata, customerDetails)
  const accountPhone =
    order.customer?.phone?.trim() || customerDetails?.phone?.trim() || null
  const deliveryPhone =
    displayShipping?.addr.phone?.trim() || accountPhone || null
  const totalLines =
    order.lines?.reduce(
      (sum: number, line: OrderItemResponse) => sum + line.quantity * line.unitAmount,
      0
    ) ?? 0
  const discount = order.amountDiscount ?? 0
  const total = Math.max(0, totalLines - discount)
  const currency = order.currency ?? "CVE"

  return (
    <div className="flex flex-1 flex-col min-h-0 bg-background">
      <div className="flex-1 overflow-auto">
        <div className="mx-auto w-full max-w-6xl px-4 py-5 md:px-5 md:py-6 space-y-5">

          {/* Hero */}
          <div className="animate-enter rounded-lg border border-border/80 bg-card p-5 shadow-none">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-border/60 bg-blue-50">
                  <Package className="h-5 w-5 text-blue-700" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap mb-1">
                    <h1 className="text-lg font-semibold font-mono tracking-tight">
                      #{order.id.slice(0, 8)}
                    </h1>
                    {order.status && (
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getOrderStatusClass(order.status.code)}`}>
                        {getOrderStatusLabel(order.status.code)}
                      </span>
                    )}
                    {order.paymentProviderType && (
                      <span className="inline-flex items-center rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {order.paymentProviderType}
                      </span>
                    )}
                  </div>
                  {order.createdAt && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(order.createdAt), "dd 'de' MMMM yyyy, HH:mm", { locale: ptBR })}
                    </p>
                  )}
                  {/* Amount hero */}
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold tabular-nums">{formatCurrency(total, currency)}</span>
                    {discount > 0 && (
                      <span className="text-xs font-medium text-emerald-700">
                        −{formatCurrency(discount, currency)} desc.
                      </span>
                    )}
                  </div>
                </div>
              </div>
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

          {/* Fulfillment */}
          <div className="animate-enter-delay-1">
            <OrderFulfillmentStatus
              orderId={order.id}
              fulfillmentStatus={order.fulfillmentStatus}
            />
          </div>

          {/* Grid */}
          <div className="grid gap-5 lg:grid-cols-3 animate-enter-delay-2">
            {/* Left sidebar */}
            <div className="space-y-5">
              <SectionCard icon={Info} iconBg="bg-muted/80" iconColor="text-primary" title="Informações">
                <div className="px-4 py-1">
                  <InfoRow
                    label="ID completo"
                    value={<span className="font-mono text-[10px] break-all">{order.id}</span>}
                  />
                  {order.mode && <InfoRow label="Modo" value={order.mode} />}
                  {order.submitType && <InfoRow label="Tipo" value={order.submitType} />}
                  {order.maximumNumberOfInstallments != null && (
                    <InfoRow label="Parcelas máx." value={order.maximumNumberOfInstallments} />
                  )}
                </div>
              </SectionCard>

              {(order.customer || customerDetails) && (
                <SectionCard icon={User} iconBg="bg-violet-50" iconColor="text-violet-700" title="Dados do cliente">
                  <div className="px-4 py-1">
                    {(order.customer?.name || customerDetails?.name) && (
                      <InfoRow
                        label="Nome"
                        value={
                          <span className="font-semibold">
                            {order.customer?.name || customerDetails?.name}
                          </span>
                        }
                      />
                    )}
                    {(order.customer?.email || customerDetails?.email) && (
                      <InfoRow
                        label="Email"
                        value={
                          <span className="break-all">
                            {order.customer?.email || customerDetails?.email}
                          </span>
                        }
                      />
                    )}
                    <InfoRow
                      label="Telefone"
                      value={
                        accountPhone ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                            {accountPhone}
                          </span>
                        ) : (
                          <span className="text-muted-foreground font-normal">—</span>
                        )
                      }
                    />
                    {(order.customer?.identifier || customerDetails?.identifier) && (
                      <InfoRow
                        label="Identificador"
                        value={
                          <span className="font-mono text-[10px] break-all">
                            {order.customer?.identifier || customerDetails?.identifier}
                          </span>
                        }
                      />
                    )}
                  </div>
                  {(order.customer?.id || customerDetails?.id) && (
                    <div className="px-4 pb-3">
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 w-full" asChild>
                        <Link href={`/dashboard/customers/${order.customer?.id ?? customerDetails?.id}`}>
                          <ExternalLink className="h-3 w-3" />
                          Ver perfil do cliente
                        </Link>
                      </Button>
                    </div>
                  )}
                </SectionCard>
              )}

              {(displayShipping || deliveryPhone || order.customer?.id || customerDetails?.id) && (
                <SectionCard
                  icon={MapPin}
                  iconBg="bg-amber-50"
                  iconColor="text-amber-800"
                  title="Morada de entrega"
                  badge={
                    displayShipping ? (
                      <span className="text-[10px] font-medium text-muted-foreground rounded border border-border/60 bg-muted/30 px-1.5 py-0.5">
                        {displayShipping.source === "session" ? "No pedido" : "Perfil"}
                      </span>
                    ) : undefined
                  }
                >
                  <div className="px-4 py-1">
                    {displayShipping ? (
                      <>
                        <InfoRow
                          label="Morada"
                          value={displayShipping.addr.address1?.trim() || "—"}
                        />
                        <InfoRow
                          label="Complemento"
                          value={displayShipping.addr.address2?.trim() || "—"}
                        />
                        <InfoRow
                          label="Cidade"
                          value={displayShipping.addr.city?.trim() || "—"}
                        />
                        <InfoRow
                          label="Ilha"
                          value={displayShipping.addr.state?.trim() || "—"}
                        />
                        <InfoRow
                          label="Cód. postal"
                          value={displayShipping.addr.zip?.trim() || "—"}
                        />
                        <InfoRow
                          label="País"
                          value={displayShipping.addr.country?.trim() || "—"}
                        />
                        <InfoRow
                          label="Telefone (contacto entrega)"
                          value={
                            deliveryPhone ? (
                              <span className="inline-flex items-center gap-1.5">
                                <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                                {deliveryPhone}
                              </span>
                            ) : (
                              <span className="text-muted-foreground font-normal">—</span>
                            )
                          }
                        />
                      </>
                    ) : (
                      <div className="py-2">
                        <p className="text-xs text-muted-foreground mb-2">
                          Morada não registada no pedido nem no perfil.
                        </p>
                        {order.customer?.id || customerDetails?.id ? (
                          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 -ml-2" asChild>
                            <Link
                              href={`/dashboard/customers/${order.customer?.id ?? customerDetails?.id}`}
                            >
                              <ExternalLink className="h-3 w-3" />
                              Ver dados do cliente
                            </Link>
                          </Button>
                        ) : null}
                        {deliveryPhone && (
                          <div className="mt-3 pt-2 border-t border-border/50">
                            <InfoRow
                              label="Telefone (conta)"
                              value={
                                <span className="inline-flex items-center gap-1.5">
                                  <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                                  {deliveryPhone}
                                </span>
                              }
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </SectionCard>
              )}
            </div>

            {/* Right column */}
            <div className="lg:col-span-2 space-y-5">
              <SectionCard
                icon={Package}
                iconBg="bg-indigo-50"
                iconColor="text-indigo-700"
                title="Itens do pedido"
                badge={
                  order.lines && order.lines.length > 0 ? (
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {order.lines.length} item{order.lines.length !== 1 ? "s" : ""}
                    </span>
                  ) : undefined
                }
              >
                {order.lines && order.lines.length > 0 ? (
                  <div className="divide-y divide-border">
                    {order.lines.map((line: OrderItemResponse) => (
                      <div key={line.id} className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-muted/10">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">
                            {line.productVariant?.product?.title ?? line.description ?? "Produto"}
                          </p>
                          {line.productVariant?.title && (
                            <p className="text-[11px] text-muted-foreground">{line.productVariant.title}</p>
                          )}
                          <p className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
                            {line.quantity} × {formatCurrency(line.unitAmount, line.currency)}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-sm tabular-nums">
                            {formatCurrency(line.quantity * line.unitAmount, line.currency)}
                          </p>
                          {line.status && (
                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium mt-1 ${getOrderStatusClass(line.status.code)}`}>
                              {getOrderStatusLabel(line.status.code)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/80 bg-muted/40 mb-3">
                      <Package className="h-6 w-6 text-muted-foreground/30" />
                    </div>
                    Nenhum item neste pedido.
                  </div>
                )}
              </SectionCard>

              <SectionCard icon={CreditCard} iconBg="bg-emerald-50" iconColor="text-emerald-700" title="Resumo do pagamento">
                <div className="px-4 py-4 space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="tabular-nums font-medium">{formatCurrency(totalLines, currency)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-700">Desconto</span>
                      <span className="tabular-nums font-medium text-emerald-700">−{formatCurrency(discount, currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold pt-3 border-t border-border">
                    <span>Total</span>
                    <span className="tabular-nums">{formatCurrency(total, currency)}</span>
                  </div>
                </div>
              </SectionCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
