import { Zap } from "lucide-react"
import type { StoreBrandSummary } from "@/lib/store-brand"
import { cn } from "@/lib/utils"

type StoreBrandLogoProps = {
  brand: StoreBrandSummary
  size?: "sm" | "md"
  className?: string
}

const sizeClasses = {
  sm: { box: "h-8 w-8", icon: "h-4 w-4" },
  md: { box: "h-12 w-12", icon: "h-6 w-6" },
} as const

export function StoreBrandLogo({ brand, size = "sm", className }: StoreBrandLogoProps) {
  const s = sizeClasses[size]

  if (brand.logoUrl) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted/40",
          s.box,
          className
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={brand.logoUrl}
          alt={brand.siteName}
          className="h-full w-full object-contain p-0.5"
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-md bg-primary",
        s.box,
        className
      )}
    >
      <Zap className={cn("text-primary-foreground", s.icon)} />
    </div>
  )
}

type StoreBrandMarkProps = {
  brand: StoreBrandSummary
  size?: "sm" | "md"
  showSubtitle?: boolean
  className?: string
}

const textSizeClasses = {
  sm: { title: "text-sm", subtitle: "text-[10px]" },
  md: { title: "text-xl", subtitle: "text-sm" },
} as const

export function StoreBrandMark({
  brand,
  size = "sm",
  showSubtitle = true,
  className,
}: StoreBrandMarkProps) {
  const text = textSizeClasses[size]

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <StoreBrandLogo brand={brand} size={size} />
      <div className="min-w-0">
        <p className={cn("truncate font-semibold leading-none tracking-tight text-foreground", text.title)}>
          {brand.siteName}
        </p>
        {showSubtitle && (
          <p
            className={cn(
              "mt-0.5 truncate font-medium uppercase tracking-wide text-muted-foreground",
              text.subtitle
            )}
          >
            Admin
          </p>
        )}
      </div>
    </div>
  )
}
