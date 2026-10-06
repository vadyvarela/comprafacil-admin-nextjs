import { ListPageSkeleton } from "@/components/admin/page-skeletons"

export default function ProductsLoading() {
  return (
    <ListPageSkeleton
      breadcrumb={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Produtos" },
      ]}
    />
  )
}
