"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Settings } from "lucide-react"

import { NavUser } from "@/components/nav-user"
import { StoreBrandLogo } from "@/components/store-brand-mark"
import type { StoreBrandSummary } from "@/lib/store-brand"
import { NAV_SECTIONS } from "@/lib/nav"
import { useCan } from "@/components/providers/permissions-provider"
import type { StoreRole } from "@/lib/auth/roles"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  storeBrand: StoreBrandSummary
  primaryRole: StoreRole | null
  user?: { name?: string | null; email?: string | null; picture?: string | null }
}

export function AppSidebar({
  storeBrand,
  primaryRole,
  user: sessionUser,
  ...props
}: AppSidebarProps) {
  const pathname = usePathname()
  const can = useCan()
  const user = sessionUser
    ? {
        name: sessionUser.name ?? "Utilizador",
        email: sessionUser.email ?? "",
        avatar: sessionUser.picture ?? "",
      }
    : { name: "Admin", email: "", avatar: "" }

  function isActive(url: string, exact: boolean) {
    if (exact) return pathname === url
    return pathname?.startsWith(url)
  }

  const showSettings = can("settings.read")

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-2.5 px-2 py-3">
          <StoreBrandLogo brand={storeBrand} size="sm" />
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-semibold text-sidebar-foreground leading-none">
              {storeBrand.siteName}
            </p>
            <p className="truncate text-[10px] text-sidebar-foreground/55 mt-0.5 font-medium uppercase">
              Admin
            </p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="py-2">
        {NAV_SECTIONS.map((group, gi) => {
          const visibleItems = group.items.filter((item) =>
            can(item.permission)
          )
          if (visibleItems.length === 0) return null

          return (
            <SidebarGroup key={group.section ?? gi} className={gi > 0 ? "mt-0.5" : ""}>
              {group.section ? (
                <SidebarGroupLabel className="px-3 text-[10px] font-semibold uppercase text-sidebar-foreground/45 mb-0.5">
                  {group.section}
                </SidebarGroupLabel>
              ) : null}
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => {
                    const active = isActive(item.url, item.exact ?? false)
                    return (
                      <SidebarMenuItem key={item.url}>
                        <SidebarMenuButton
                          asChild
                          tooltip={item.title}
                          isActive={active}
                          className="h-9"
                        >
                          <Link href={item.url}>
                            <item.icon className="h-4 w-4 shrink-0" />
                            <span className="font-medium">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )
        })}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border pb-2">
        {showSettings ? (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Definições"
                isActive={
                  Boolean(
                    pathname?.startsWith("/dashboard/settings") &&
                      !pathname?.startsWith("/dashboard/settings/page-builder")
                  )
                }
                className="h-9"
              >
                <Link href="/dashboard/settings">
                  <Settings className="h-4 w-4 shrink-0" />
                  <span className="font-medium">Definições</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        ) : null}
        <NavUser user={user} role={primaryRole} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
