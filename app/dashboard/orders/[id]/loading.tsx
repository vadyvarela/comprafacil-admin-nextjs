import { DashboardHeader } from "@/components/layout/dashboard-header"
import { OrderDetailSkeleton } from "@/components/orders/order-detail-skeleton"

export default function OrderDetailLoading() {
  return (
    <>
      <DashboardHeader
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Pedidos", href: "/dashboard/orders" },
          { label: "…" },
        ]}
      />
      <OrderDetailSkeleton />
    </>
  )
}
