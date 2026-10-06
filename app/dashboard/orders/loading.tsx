import { ListPageSkeleton } from "@/components/admin/page-skeletons"

export default function OrdersLoading() {
  return (
    <ListPageSkeleton
      breadcrumb={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Pedidos" },
      ]}
      filterRows={2}
    />
  )
}
