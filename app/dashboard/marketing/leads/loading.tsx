import { ListPageSkeleton } from "@/components/admin/page-skeletons"

export default function LeadsLoading() {
  return (
    <ListPageSkeleton
      breadcrumb={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Marketing" },
        { label: "Leads" },
      ]}
      filterRows={2}
    />
  )
}
