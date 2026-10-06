"use client"

import { Fragment } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { SETTINGS_GROUPS, SETTINGS_TABS, type SettingsTab } from "@/lib/nav"
import { useCan } from "@/components/providers/permissions-provider"

export function SettingsSubnav() {
  const pathname = usePathname() ?? ""
  const can = useCan()

  const visibleTabs = SETTINGS_TABS.filter((tab) => can(tab.permission))
  const overview = visibleTabs.filter((tab) => !tab.group)
  const groups = SETTINGS_GROUPS.map((group) => ({
    group,
    tabs: visibleTabs.filter((tab) => tab.group === group),
  })).filter(({ tabs }) => tabs.length > 0)

  function renderTab(tab: SettingsTab) {
    const active = tab.prefix ? pathname.startsWith(tab.prefix) : pathname === tab.href
    return (
      <Link
        key={tab.href}
        href={tab.href}
        aria-current={active ? "page" : undefined}
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
  }

  return (
    <nav
      className="sticky top-12 z-30 border-b border-border/80 bg-background"
      aria-label="Secções de definições"
    >
      <div className="flex items-center gap-5 overflow-x-auto px-4 md:px-5">
        {overview.map(renderTab)}
        {groups.map(({ group, tabs }) => (
          <Fragment key={group}>
            <span aria-hidden className="h-4 w-px shrink-0 bg-border" />
            <span className="shrink-0 text-[11px] font-semibold uppercase text-muted-foreground/70">
              {group}
            </span>
            {tabs.map(renderTab)}
          </Fragment>
        ))}
      </div>
    </nav>
  )
}
