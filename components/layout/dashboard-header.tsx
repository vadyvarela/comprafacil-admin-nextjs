"use client"

import Link from "next/link"
import { Bell, Search } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"

export type BreadcrumbItemType = {
  label: string
  href?: string
}

type DashboardHeaderProps = {
  items: BreadcrumbItemType[]
  actions?: React.ReactNode
}

export function DashboardHeader({ items, actions }: DashboardHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-sm supports-backdrop-filter:bg-background/60 sticky top-0 z-40">
      <div className="flex items-center gap-3 min-w-0">
        <SidebarTrigger className="-ml-0.5 size-8 shrink-0" />
        <Separator orientation="vertical" className="h-5 shrink-0" />
        <Breadcrumb>
          <BreadcrumbList className="gap-1.5 text-xs flex-nowrap">
            {items.map((item, i) => {
              const isLast = i === items.length - 1
              return (
                <span key={i} className="contents">
                  {i > 0 && <BreadcrumbSeparator className="hidden md:block shrink-0" />}
                  <BreadcrumbItem className={i === 0 && items.length > 1 ? "hidden md:flex" : ""}>
                    {isLast ? (
                      <BreadcrumbPage className="max-w-[200px] truncate font-semibold text-foreground">
                        {item.label}
                      </BreadcrumbPage>
                    ) : item.href ? (
                      <BreadcrumbLink
                        href={item.href}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {item.label}
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage className="font-semibold text-foreground">
                        {item.label}
                      </BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                </span>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Search trigger */}
        <div className="hidden md:flex items-center gap-2 bg-muted/50 border border-border rounded-lg px-3 py-1.5 text-muted-foreground hover:border-border/80 transition-colors cursor-pointer max-w-[220px]">
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="text-xs truncate">Buscar...</span>
          <kbd className="ml-auto text-[10px] bg-background/80 px-1.5 py-0.5 rounded text-muted-foreground/60 border border-border font-mono shrink-0">
            ⌘K
          </kbd>
        </div>
        {actions}
        <Button
          variant="ghost"
          size="icon"
          className="size-8 relative text-muted-foreground hover:text-foreground"
          aria-label="Notificações"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary ring-2 ring-background" />
        </Button>
      </div>
    </header>
  )
}
