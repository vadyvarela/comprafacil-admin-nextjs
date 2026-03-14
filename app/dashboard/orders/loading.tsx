import { DashboardHeader } from "@/components/layout/dashboard-header"
import { OrderListSkeleton } from "@/components/orders/order-list-skeleton"

export default function OrdersLoading() {
  return (
    <>
      <DashboardHeader
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Pedidos" },
        ]}
      />
      <div className="flex flex-1 flex-col">
        <div className="border-b px-4 py-3">
          <div className="h-16" />
        </div>
        <div className="flex-1 overflow-auto p-4">
          <OrderListSkeleton />
        </div>
      </div>
    </>
  )
}
