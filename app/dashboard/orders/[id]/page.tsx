import { notFound } from "next/navigation"
import { getOrderById } from "@/lib/actions/orders"
import { getOrderAuditLogs } from "@/lib/actions/auditLogs"
import { can, getPrincipal } from "@/lib/auth/principal"
import {
  getCustomerDetails,
  getCustomerDetailsByExternalId,
} from "@/lib/actions/customers"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { OrderDetail } from "@/components/orders/order-detail"
import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params
  const canReconcilePayment = can(await getPrincipal(), "orders.reconcile")
  const result = await getOrderById(id)

  if (!result.ok) {
    if (result.notFound) notFound()
    return (
      <>
        <DashboardHeader
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Pedidos", href: "/dashboard/orders" },
            { label: "Detalhe" },
          ]}
        />
        <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
          <div className="text-center space-y-3 max-w-md">
            <ShoppingCart className="h-10 w-10 mx-auto text-muted-foreground" />
            <h2 className="text-lg font-semibold">Erro ao carregar pedido</h2>
            <p className="text-sm text-muted-foreground">{result.error}</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/orders">
                Voltar aos pedidos
              </Link>
            </Button>
          </div>
        </div>
      </>
    )
  }

  const order = result.data
  const shortId = order.id.slice(0, 8)

  // A ficha do cliente traz morada, telefone e email. Ver o pedido não é o
  // mesmo que ver a pessoa: um viewer chega aqui, e não deve levar isto.
  // O padrão já existia em app/dashboard/page.tsx — faltava aqui.
  const canReadCustomerPii = can(await getPrincipal(), "customers.pii.read")

  let customerDetails = null
  if (order.customer && canReadCustomerPii) {
    if (order.customer.id) {
      const byId = await getCustomerDetails(order.customer.id)
      if (byId.ok) customerDetails = byId.data
    }
    if (!customerDetails && order.customer.customerExternalId) {
      const byExt = await getCustomerDetailsByExternalId(
        order.customer.customerExternalId
      )
      if (byExt.ok) customerDetails = byExt.data
    }
  }

  const auditResult = await getOrderAuditLogs(order.id)

  return (
    <>
      <DashboardHeader
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Pedidos", href: "/dashboard/orders" },
          { label: `${shortId}…` },
        ]}
      />
      <OrderDetail
        order={order}
        customerDetails={customerDetails}
        auditLogs={auditResult.ok ? auditResult.data.data : []}
        auditError={auditResult.ok ? null : auditResult.error}
        canReconcilePayment={canReconcilePayment}
      />
    </>
  )
}
