import { DashboardHeader } from "@/components/layout/dashboard-header"
import { Skeleton } from "@/components/ui/skeleton"

export default function CustomerDetailLoading() {
  return (
    <>
      <DashboardHeader
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Clientes", href: "/dashboard/customers" },
          { label: "…" },
        ]}
      />
      <div className="border-b border-border bg-card px-4 py-2.5">
        <Skeleton className="h-5 w-48" />
      </div>
      <div className="p-4 md:p-6">
        <div className="grid gap-4 lg:grid-cols-2 max-w-3xl">
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="h-40 rounded-lg" />
        </div>
      </div>
    </>
  )
}
