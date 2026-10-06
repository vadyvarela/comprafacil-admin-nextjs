import { OverviewPageSkeleton } from "@/components/admin/page-skeletons"

export default function AnalyticsLoading() {
  return (
    <OverviewPageSkeleton
      breadcrumb={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Analytics" },
      ]}
    />
  )
}
