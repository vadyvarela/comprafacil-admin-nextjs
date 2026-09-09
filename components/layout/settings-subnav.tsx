"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { SETTINGS_TABS } from "@/lib/nav"
import { useCan } from "@/components/providers/permissions-provider"

export function SettingsSubnav() {
  const pathname = usePathname() ?? ""
  const can = useCan()

  const visibleTabs = SETTINGS_TABS.filter((tab) => can(tab.permission))

  return (
    <nav
      className="sticky top-12 z-30 border-b border-border/80 bg-background"
      aria-label="Secções de definições"
    >
      <div className="flex gap-6 overflow-x-auto px-4 md:px-5">
        {visibleTabs.map((tab) => {
          const active = tab.prefix
            ? pathname.startsWith(tab.prefix)
            : pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "-mb-px shrink-0 border-b-2 py-2.5 text-[13px] transition-colors",
                active
                  ? "border-primary font-medium text-foreground"
                  : "border-transparent text-muted-foreground hover:text-primary"
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
