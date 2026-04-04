"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Package,
  FolderTree,
  TicketPercent,
  Image as ImageIcon,
  Tag,
  ShoppingCart,
  CreditCard,
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  Zap,
} from "lucide-react"

import { NavUser } from "@/components/nav-user"
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

const NAV = [
  {
    section: null,
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, exact: true },
      { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3, exact: false },
    ],
  },
  {
    section: "Vendas",
    items: [
      { title: "Pedidos", url: "/dashboard/orders", icon: ShoppingCart, exact: false },
      { title: "Clientes", url: "/dashboard/customers", icon: Users, exact: false },
      { title: "Transações", url: "/dashboard/transactions", icon: CreditCard, exact: false },
    ],
  },
  {
    section: "Catálogo",
    items: [
      { title: "Produtos", url: "/dashboard/products", icon: Package, exact: false },
      { title: "Categorias", url: "/dashboard/categories", icon: FolderTree, exact: false },
      { title: "Marcas", url: "/dashboard/brands", icon: Tag, exact: false },
    ],
  },
  {
    section: "Marketing",
    items: [
      { title: "Cupons", url: "/dashboard/coupons", icon: TicketPercent, exact: false },
      { title: "Banners", url: "/dashboard/banners", icon: ImageIcon, exact: false },
    ],
  },
]

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user?: { name?: string | null; email?: string | null; picture?: string | null }
}

export function AppSidebar({ user: sessionUser, ...props }: AppSidebarProps) {
  const pathname = usePathname()
  const user = sessionUser
    ? {
        name: sessionUser.name ?? "Utilizador",
        email: sessionUser.email ?? "",
        avatar: sessionUser.picture ?? "",
      }
    : { name: "Admin", email: "admin@techarena.com", avatar: "" }

  function isActive(url: string, exact: boolean) {
    if (exact) return pathname === url
    return pathname?.startsWith(url)
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      {/* Logo */}
      <SidebarHeader className="border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-2.5 px-2 py-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 via-indigo-500 to-violet-600 shadow-md shadow-indigo-900/40">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-bold text-white leading-none">TechArena</p>
            <p className="truncate text-[10px] text-sidebar-foreground/45 mt-0.5 font-medium tracking-wide uppercase">Admin</p>
          </div>
        </Link>
      </SidebarHeader>

      {/* Nav */}
      <SidebarContent className="py-2">
        {NAV.map((group, gi) => (
          <SidebarGroup key={gi} className={gi > 0 ? "mt-0.5" : ""}>
            {group.section && (
              <SidebarGroupLabel className="px-3 text-[9px] font-bold uppercase tracking-[0.12em] text-sidebar-foreground/30 mb-0.5">
                {group.section}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active = isActive(item.url, item.exact)
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
        ))}
      </SidebarContent>

      {/* Settings + User */}
      <SidebarFooter className="border-t border-sidebar-border pb-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Definições"
              isActive={pathname?.startsWith("/dashboard/settings")}
              className="h-9"
            >
              <Link href="/dashboard/settings">
                <Settings className="h-4 w-4 shrink-0" />
                <span className="font-medium">Definições</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <NavUser user={user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
