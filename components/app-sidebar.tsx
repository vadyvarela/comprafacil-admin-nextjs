"use client"

import * as React from "react"
import { Package, Box, FolderTree, TicketPercent, Image as ImageIcon, Tag, ShoppingCart, CreditCard } from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// Menu data
const data = {
  user: {
    name: "Admin",
    email: "admin@techarena.com",
    avatar: "/avatars/admin.jpg",
  },
  navMain: [
    {
      title: "Produtos",
      url: "/dashboard/products",
      icon: Package,
      isActive: true,
      items: [
        {
          title: "Todos os Produtos",
          url: "/dashboard/products",
        },
        {
          title: "Criar Produto",
          url: "/dashboard/products/new",
        },
      ],
    },
    {
      title: "Categorias",
      url: "/dashboard/categories",
      icon: FolderTree,
      isActive: false,
      items: [
        {
          title: "Todas as Categorias",
          url: "/dashboard/categories",
        },
        {
          title: "Criar Categoria",
          url: "/dashboard/categories/new",
        },
      ],
    },
    {
      title: "Marcas",
      url: "/dashboard/brands",
      icon: Tag,
      isActive: false,
      items: [
        {
          title: "Todas as Marcas",
          url: "/dashboard/brands",
        },
      ],
    },
    {
      title: "Cupons",
      url: "/dashboard/coupons",
      icon: TicketPercent,
      isActive: false,
      items: [
        {
          title: "Todos os Cupons",
          url: "/dashboard/coupons",
        },
        {
          title: "Criar Cupom",
          url: "/dashboard/coupons/new",
        },
      ],
    },
    {
      title: "Banners",
      url: "/dashboard/banners",
      icon: ImageIcon,
      isActive: false,
      items: [
        {
          title: "Todos os Banners",
          url: "/dashboard/banners",
        },
      ],
    },
    {
      title: "Pedidos",
      url: "/dashboard/orders",
      icon: ShoppingCart,
      isActive: false,
      items: [
        {
          title: "Todos os Pedidos",
          url: "/dashboard/orders",
        },
      ],
    },
    {
      title: "Transações",
      url: "/dashboard/transactions",
      icon: CreditCard,
      isActive: false,
      items: [
        {
          title: "Todas as Transações",
          url: "/dashboard/transactions",
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-3 py-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Package className="h-4 w-4" />
          </div>
          <span className="font-semibold text-sm">Admin</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
