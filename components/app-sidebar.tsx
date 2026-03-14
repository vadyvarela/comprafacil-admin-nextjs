"use client"

import * as React from "react"
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
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

const SECTIONS = {
  vendas: {
    label: "Vendas",
    items: [
      {
        title: "Pedidos",
        url: "/dashboard/orders",
        icon: ShoppingCart,
        items: [{ title: "Todos os Pedidos", url: "/dashboard/orders" }],
      },
      {
        title: "Clientes",
        url: "/dashboard/customers",
        icon: Users,
        items: [{ title: "Clientes", url: "/dashboard/customers" }],
      },
      {
        title: "Transações",
        url: "/dashboard/transactions",
        icon: CreditCard,
        items: [{ title: "Todas as Transações", url: "/dashboard/transactions" }],
      },
    ],
  },
  catalogo: {
    label: "Catálogo",
    items: [
      {
        title: "Produtos",
        url: "/dashboard/products",
        icon: Package,
        items: [
          { title: "Todos os Produtos", url: "/dashboard/products" },
          { title: "Criar Produto", url: "/dashboard/products/new" },
        ],
      },
      {
        title: "Categorias",
        url: "/dashboard/categories",
        icon: FolderTree,
        items: [
          { title: "Todas as Categorias", url: "/dashboard/categories" },
          { title: "Criar Categoria", url: "/dashboard/categories/new" },
        ],
      },
      {
        title: "Marcas",
        url: "/dashboard/brands",
        icon: Tag,
        items: [{ title: "Todas as Marcas", url: "/dashboard/brands" }],
      },
    ],
  },
  marketing: {
    label: "Marketing",
    items: [
      {
        title: "Cupons",
        url: "/dashboard/coupons",
        icon: TicketPercent,
        items: [
          { title: "Todos os Cupons", url: "/dashboard/coupons" },
          { title: "Criar Cupom", url: "/dashboard/coupons/new" },
        ],
      },
      {
        title: "Banners",
        url: "/dashboard/banners",
        icon: ImageIcon,
        items: [{ title: "Todos os Banners", url: "/dashboard/banners" }],
      },
    ],
  },
} as const

const data = {
  user: {
    name: "Admin",
    email: "admin@techarena.com",
    avatar: "/avatars/admin.jpg",
  },
  home: { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  sections: SECTIONS,
}

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user?: { name?: string | null; email?: string | null; picture?: string | null };
};

export function AppSidebar({ user: sessionUser, ...props }: AppSidebarProps) {
  const user = sessionUser
    ? {
        name: sessionUser.name ?? "Utilizador",
        email: sessionUser.email ?? "",
        avatar: sessionUser.picture ?? "",
      }
    : data.user;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Package className="h-4 w-4" />
          </div>
          <span className="font-semibold text-sm truncate">Compra Fácil</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavMain
              items={[
                {
                  title: data.home.title,
                  url: data.home.url,
                  icon: data.home.icon,
                  isActive: true,
                  items: [],
                },
              ]}
            />
          </SidebarGroupContent>
        </SidebarGroup>
        {Object.entries(data.sections).map(([key, section]) => (
          <SidebarGroup key={key}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <NavMain
                items={section.items.map((item) => ({
                  ...item,
                  isActive: false,
                }))}
              />
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
