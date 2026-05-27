"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const TABS = [
  {
    href: "/dashboard/settings",
    label: "Geral",
    isActive: (p: string) => p === "/dashboard/settings",
  },
  {
    href: "/dashboard/settings/store",
    label: "Loja",
    isActive: (p: string) => p.startsWith("/dashboard/settings/store"),
  },
  {
    href: "/dashboard/settings/page-builder",
    label: "Page Builder",
    isActive: (p: string) => p.startsWith("/dashboard/settings/page-builder"),
  },
  {
    href: "/dashboard/settings/maintenance",
    label: "Manutenção",
    isActive: (p: string) => p.startsWith("/dashboard/settings/maintenance"),
  },
  {
    href: "/dashboard/settings/shipping",
    label: "Envios",
    isActive: (p: string) => p.startsWith("/dashboard/settings/shipping"),
  },
  {
    href: "/dashboard/settings/security",
    label: "Segurança",
    isActive: (p: string) => p.startsWith("/dashboard/settings/security"),
  },
] as const

export function SettingsSubnav() {
  const pathname = usePathname() ?? ""

  return (
    <nav
      className="sticky top-12 z-30 border-b border-border/80 bg-background"
      aria-label="Secções de definições"
    >
      <div className="flex gap-6 px-4 md:px-5">
        {TABS.map((tab) => {
          const active = tab.isActive(pathname)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "-mb-px border-b-2 py-2.5 text-[13px] transition-colors",
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
