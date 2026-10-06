import { ListPageSkeleton } from "@/components/admin/page-skeletons"

export default function TransactionsLoading() {
  return (
    <ListPageSkeleton
      breadcrumb={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Transações" },
      ]}
      filterRows={2}
    />
  )
}
