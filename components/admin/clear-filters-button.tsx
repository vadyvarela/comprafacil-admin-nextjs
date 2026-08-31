import Link from "next/link"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ClearFiltersButtonProps = {
  href: string
  label?: string
  className?: string
}

export function ClearFiltersButton({
  href,
  label = "Limpar filtros",
  className,
}: ClearFiltersButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn("h-8 gap-1.5 px-2.5 text-xs text-muted-foreground", className)}
      asChild
    >
      <Link href={href}>
        <X className="h-3.5 w-3.5" />
        {label}
      </Link>
    </Button>
  )
}
