"use client"

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
    <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border/80 bg-background px-3 md:px-4 sticky top-0 z-40">
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
                      <BreadcrumbLink href={item.href}>
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

      {actions ? <div className="flex items-center gap-2 shrink-0">{actions}</div> : null}
    </header>
  )
}
