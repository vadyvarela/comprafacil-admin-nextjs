import { notFound } from "next/navigation"
import { getOrderById } from "@/lib/actions/orders"
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

  let customerDetails = null
  if (order.customer) {
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

  return (
    <>
      <DashboardHeader
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Pedidos", href: "/dashboard/orders" },
          { label: `${shortId}…` },
        ]}
      />
      <OrderDetail order={order} customerDetails={customerDetails} />
    </>
  )
}
