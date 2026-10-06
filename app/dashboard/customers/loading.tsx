import { ListPageSkeleton } from "@/components/admin/page-skeletons"

export default function CustomersLoading() {
  return (
    <ListPageSkeleton
      breadcrumb={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Clientes" },
      ]}
    />
  )
}
