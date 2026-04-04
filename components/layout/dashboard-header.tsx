"use client"

import Link from "next/link"
import { Bell } from "lucide-react"
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
    <header className="flex h-13 shrink-0 items-center justify-between gap-3 border-b border-border bg-card/80 px-3 backdrop-blur supports-[backdrop-filter]:bg-card/60">
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
                      <BreadcrumbPage className="max-w-[200px] truncate font-medium text-foreground">
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
                      <BreadcrumbPage className="font-medium text-foreground">
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

      <div className="flex items-center gap-1.5 shrink-0">
        {actions}
        <Button
          variant="ghost"
          size="icon"
          className="size-8 relative text-muted-foreground hover:text-foreground"
          aria-label="Notificações"
        >
          <Bell className="h-4 w-4" />
          {/* Notification dot */}
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
        </Button>
      </div>
    </header>
  )
}
