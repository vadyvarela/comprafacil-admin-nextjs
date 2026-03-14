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
}

export function DashboardHeader({ items }: DashboardHeaderProps) {
  return (
    <header className="flex h-11 shrink-0 items-center gap-2 border-b border-border bg-card px-3">
      <SidebarTrigger className="-ml-0.5 size-8" />
      <Separator orientation="vertical" className="h-4" />
      <Breadcrumb>
        <BreadcrumbList className="gap-1 text-xs">
          {items.map((item, i) => {
            const isLast = i === items.length - 1
            return (
              <span key={i} className="contents">
                {i > 0 && (
                  <BreadcrumbSeparator className="hidden md:block" />
                )}
                <BreadcrumbItem className={i === 0 ? "hidden md:block" : ""}>
                  {isLast ? (
                    <BreadcrumbPage className="max-w-[180px] truncate font-medium text-foreground">
                      {item.label}
                    </BreadcrumbPage>
                  ) : item.href ? (
                    <BreadcrumbLink href={item.href} className="text-muted-foreground hover:text-foreground">
                      {item.label}
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage className="font-medium text-foreground">{item.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </span>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  )
}
