"use client"

import * as React from "react"
import { Package, Box, FolderTree, TicketPercent, Image as ImageIcon, Tag } from "lucide-react"

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
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <Package className="h-5 w-5" />
          <span className="font-semibold">TechArena Admin</span>
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
