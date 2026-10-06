import { ListPageSkeleton } from "@/components/admin/page-skeletons"

export default function LogsLoading() {
  return (
    <ListPageSkeleton
      breadcrumb={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Logs" },
      ]}
      filterRows={1}
    />
  )
}
