import { Skeleton } from "@/components/ui/skeleton"

export function OrderListSkeleton() {
  return (
    <div className="space-y-0">
      {/* Desktop: table skeleton */}
      <div className="hidden lg:block rounded-md border overflow-hidden">
        <div className="w-full">
          <div className="border-b bg-muted/50 px-4 py-2.5 flex gap-4">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-[140px]" />
            <Skeleton className="h-4 w-[120px]" />
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-[80px]" />
          </div>
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="border-b px-4 py-2.5 flex gap-4 items-center"
            >
              <Skeleton className="h-4 w-[90px]" />
              <Skeleton className="h-4 flex-1 max-w-[180px]" />
              <Skeleton className="h-4 w-[110px]" />
              <Skeleton className="h-5 w-[100px] rounded-full" />
              <Skeleton className="h-4 w-[70px]" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: card skeletons */}
      <div className="lg:hidden space-y-2">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="rounded-lg border p-3 flex items-start gap-3"
          >
            <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3 w-full max-w-[200px]" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-4 w-4 shrink-0 mt-0.5" />
          </div>
        ))}
      </div>
    </div>
  )
}
