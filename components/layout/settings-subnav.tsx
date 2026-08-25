"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useSettingsAccess } from "@/components/layout/settings-access-context"

/** Ordem: loja → aparência/home → operação → equipa/segurança. */
const TABS = [
  {
    href: "/dashboard/settings",
    label: "Geral",
    isActive: (p: string) => p === "/dashboard/settings",
    ownerOnly: false,
  },
  {
    href: "/dashboard/settings/store",
    label: "Loja",
    isActive: (p: string) => p.startsWith("/dashboard/settings/store"),
    ownerOnly: false,
  },
  {
    href: "/dashboard/settings/appearance",
    label: "Aparência",
    isActive: (p: string) => p.startsWith("/dashboard/settings/appearance"),
    ownerOnly: false,
  },
  {
    href: "/dashboard/settings/page-builder",
    label: "Page Builder",
    isActive: (p: string) => p.startsWith("/dashboard/settings/page-builder"),
    ownerOnly: false,
  },
  {
    href: "/dashboard/settings/shipping",
    label: "Envios",
    isActive: (p: string) => p.startsWith("/dashboard/settings/shipping"),
    ownerOnly: false,
  },
  {
    href: "/dashboard/settings/notifications",
    label: "Notificações",
    isActive: (p: string) => p.startsWith("/dashboard/settings/notifications"),
    ownerOnly: false,
  },
  {
    href: "/dashboard/settings/maintenance",
    label: "Manutenção",
    isActive: (p: string) => p.startsWith("/dashboard/settings/maintenance"),
    ownerOnly: false,
  },
  {
    href: "/dashboard/settings/team",
    label: "Equipa",
    isActive: (p: string) => p.startsWith("/dashboard/settings/team"),
    ownerOnly: true,
  },
  {
    href: "/dashboard/settings/security",
    label: "Segurança",
    isActive: (p: string) => p.startsWith("/dashboard/settings/security"),
    ownerOnly: true,
  },
] as const

export function SettingsSubnav() {
  const pathname = usePathname() ?? ""
  const { isOwner } = useSettingsAccess()

  const visibleTabs = TABS.filter((tab) => !tab.ownerOnly || isOwner)

  return (
    <nav
      className="sticky top-12 z-30 border-b border-border/80 bg-background"
      aria-label="Secções de definições"
    >
      <div className="flex gap-6 overflow-x-auto px-4 md:px-5">
        {visibleTabs.map((tab) => {
          const active = tab.isActive(pathname)
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
