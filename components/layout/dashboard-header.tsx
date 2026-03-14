"use client"

import Link from "next/link"
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

const BRAND = "Compra Fácil"

export function DashboardHeader({ items }: DashboardHeaderProps) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <SidebarTrigger className="-ml-0.5 size-8" />
      <Separator orientation="vertical" className="h-5" />
      <Link
        href="/dashboard"
        className="hidden shrink-0 font-semibold text-sm text-foreground md:inline-block"
      >
        {BRAND}
      </Link>
      <Separator orientation="vertical" className="hidden h-5 md:block" />
      <Breadcrumb>
        <BreadcrumbList className="gap-1.5 text-xs">
          {items.map((item, i) => {
            const isLast = i === items.length - 1
            return (
              <span key={i} className="contents">
                {i > 0 && <BreadcrumbSeparator className="hidden md:block" />}
                <BreadcrumbItem className={i === 0 ? "hidden md:block" : ""}>
                  {isLast ? (
                    <BreadcrumbPage className="max-w-[200px] truncate font-medium text-foreground">
                      {item.label}
                    </BreadcrumbPage>
                  ) : item.href ? (
                    <BreadcrumbLink
                      href={item.href}
                      className="text-muted-foreground hover:text-foreground"
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
    </header>
  )
}
