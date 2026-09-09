import {
  BarChart3,
  CreditCard,
  FolderTree,
  Image as ImageIcon,
  Images,
  LayoutDashboard,
  LayoutTemplate,
  Package,
  PhoneCall,
  ScrollText,
  ShoppingCart,
  Tag,
  TicketPercent,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Permission } from "@/lib/auth/permissions";

/**
 * A navegação e a autorização de rotas, numa tabela só.
 *
 * Antes eram três, com formatos diferentes e o mesmo conteúdo: `ROUTE_MODULES`
 * (prefixos), `NAV_MODULE_MAP` (URLs exactos) e a lista `NAV` da sidebar.
 * Acrescentar uma secção obrigava a tocar nas três, e já tinham divergido —
 * `/dashboard/store-home` não constava de nenhuma das duas primeiras, o que
 * significava que a rota caía no módulo `dashboard` e ficava visível a toda a
 * gente.
 *
 * Cada entrada diz onde vai, como se chama, e o que é preciso para lá chegar.
 */

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  /** Só a rota exacta activa o item (o Dashboard, que é prefixo de tudo). */
  exact?: boolean;
  permission: Permission;
}

export interface NavSection {
  section: string;
  items: NavItem[];
}

/** Ordem: operação diária → catálogo → aquisição → conteúdo → sistema. */
export const NAV_SECTIONS: NavSection[] = [
  {
    section: "Visão geral",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
        exact: true,
        permission: "dashboard.read",
      },
      {
        title: "Analytics",
        url: "/dashboard/analytics",
        icon: BarChart3,
        permission: "analytics.read",
      },
    ],
  },
  {
    section: "Vendas",
    items: [
      {
        title: "Pedidos",
        url: "/dashboard/orders",
        icon: ShoppingCart,
        permission: "orders.read",
      },
      {
        title: "Clientes",
        url: "/dashboard/customers",
        icon: Users,
        permission: "customers.read",
      },
      {
        title: "Transações",
        url: "/dashboard/transactions",
        icon: CreditCard,
        permission: "transactions.read",
      },
    ],
  },
  {
    section: "Catálogo",
    items: [
      {
        title: "Produtos",
        url: "/dashboard/products",
        icon: Package,
        permission: "products.read",
      },
      {
        title: "Categorias",
        url: "/dashboard/categories",
        icon: FolderTree,
        permission: "categories.read",
      },
      {
        title: "Marcas",
        url: "/dashboard/brands",
        icon: Tag,
        permission: "brands.read",
      },
    ],
  },
  {
    section: "Marketing",
    items: [
      {
        title: "Leads",
        url: "/dashboard/marketing/leads",
        icon: PhoneCall,
        permission: "marketing.leads.read",
      },
      {
        title: "Cupões",
        url: "/dashboard/coupons",
        icon: TicketPercent,
        permission: "coupons.read",
      },
    ],
  },
  {
    section: "Conteúdo",
    items: [
      {
        title: "Banners",
        url: "/dashboard/banners",
        icon: ImageIcon,
        permission: "banners.read",
      },
      {
        title: "Biblioteca",
        url: "/dashboard/media",
        icon: Images,
        permission: "media.read",
      },
      {
        title: "Page Builder",
        url: "/dashboard/settings/page-builder",
        icon: LayoutTemplate,
        permission: "settings.read",
      },
    ],
  },
  {
    section: "Sistema",
    items: [
      {
        title: "Logs",
        url: "/dashboard/logs",
        icon: ScrollText,
        permission: "audit.read",
      },
    ],
  },
];

export interface SettingsTab {
  href: string;
  label: string;
  /** Prefixo que activa o separador; omitir usa correspondência exacta. */
  prefix?: string;
  permission: Permission;
}

export const SETTINGS_TABS: SettingsTab[] = [
  { href: "/dashboard/settings", label: "Geral", permission: "settings.read" },
  {
    href: "/dashboard/settings/store",
    label: "Loja",
    prefix: "/dashboard/settings/store",
    permission: "settings.read",
  },
  {
    href: "/dashboard/settings/integrations/meta",
    label: "Meta",
    prefix: "/dashboard/settings/integrations",
    permission: "marketing.analytics.read",
  },
  {
    href: "/dashboard/settings/appearance",
    label: "Aparência",
    prefix: "/dashboard/settings/appearance",
    permission: "settings.write",
  },
  {
    href: "/dashboard/settings/page-builder",
    label: "Page Builder",
    prefix: "/dashboard/settings/page-builder",
    permission: "settings.write",
  },
  {
    href: "/dashboard/settings/shipping",
    label: "Envios",
    prefix: "/dashboard/settings/shipping",
    permission: "settings.write",
  },
  {
    href: "/dashboard/settings/notifications",
    label: "Notificações",
    prefix: "/dashboard/settings/notifications",
    permission: "settings.notifications.write",
  },
  {
    href: "/dashboard/settings/maintenance",
    label: "Manutenção",
    prefix: "/dashboard/settings/maintenance",
    permission: "settings.write",
  },
  {
    href: "/dashboard/settings/team",
    label: "Equipa",
    prefix: "/dashboard/settings/team",
    permission: "team.read",
  },
  {
    href: "/dashboard/settings/security",
    label: "Segurança",
    prefix: "/dashboard/settings/security",
    permission: "security.tokens.read",
  },
];

/**
 * Permissão exigida por um caminho do dashboard.
 *
 * O mais específico ganha, para `/dashboard/settings/team` não cair em
 * `/dashboard/settings`. Devolve `null` para caminhos não mapeados — e quem
 * chama decide, em vez de os deixar passar como o `canAccessNavItem` antigo,
 * que respondia `true` a tudo o que não conhecia.
 */
export function permissionForPath(pathname: string): Permission | null {
  const candidates = [
    ...SETTINGS_TABS.map((tab) => ({
      prefix: tab.prefix ?? tab.href,
      permission: tab.permission,
      exact: !tab.prefix,
    })),
    ...NAV_SECTIONS.flatMap((section) =>
      section.items.map((item) => ({
        prefix: item.url,
        permission: item.permission,
        exact: item.exact ?? false,
      })),
    ),
  ].sort((a, b) => b.prefix.length - a.prefix.length);

  for (const candidate of candidates) {
    if (candidate.exact ? pathname === candidate.prefix : pathname.startsWith(candidate.prefix)) {
      return candidate.permission;
    }
  }
  return null;
}
