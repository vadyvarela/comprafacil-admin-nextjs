import type { ReactNode } from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { MarketingSubnav } from "@/components/marketing/marketing-subnav"
import { cn } from "@/lib/utils"

export function MarketingPageFrame({
  action,
  children,
  scroll = false,
}: {
  items?: { label: string; href?: string }[]
  action?: ReactNode
  children: ReactNode
  scroll?: boolean
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="flex h-11 shrink-0 items-center gap-2 border-b border-border bg-background px-2 md:px-3">
        <SidebarTrigger className="-ml-0.5 size-8 shrink-0" />
        <Separator orientation="vertical" className="h-4" />
        <MarketingSubnav />
        {action ? <div className="ml-auto flex shrink-0 items-center gap-2">{action}</div> : null}
      </header>
      <div
        className={cn(
          "min-h-0 flex-1",
          scroll ? "overflow-y-auto" : "flex flex-col overflow-hidden",
        )}
      >
        {children}
      </div>
    </div>
  )
}
