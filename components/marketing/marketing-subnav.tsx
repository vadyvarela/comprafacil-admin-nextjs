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
    <nav className="flex min-w-0 items-center gap-0.5">
      {TABS.map((tab) => {
        const active = tab.exact ? pathname === tab.href : pathname?.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-md px-2.5 py-1 text-[13px] font-medium",
              active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
