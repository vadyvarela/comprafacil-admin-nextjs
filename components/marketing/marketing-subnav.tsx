"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const TABS = [
  { href: "/dashboard/marketing", label: "Hoje", exact: true },
  { href: "/dashboard/marketing/campaigns", label: "Campanhas", exact: false },
  { href: "/dashboard/marketing/content", label: "Posts", exact: false },
]

export function MarketingSubnav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-1 border-b border-border bg-background px-4 md:px-5">
      {TABS.map((tab) => {
        const active = tab.exact ? pathname === tab.href : pathname?.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "relative px-2.5 py-2 text-[12px] font-medium tracking-tight",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
            {active ? (
              <span className="absolute inset-x-2 -bottom-px h-px bg-foreground" />
            ) : null}
          </Link>
        )
      })}
    </nav>
  )
}
