import {
  AlertTriangle,
  BarChart3,
  Bell,
  Construction,
  Megaphone,
  Palette,
  Shield,
  Store,
  Truck,
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
  Wallet,
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
  {
    // Só aparece a quem tem `platformAdmin` na API — nenhum role de loja
    // recebe estas permissões.
    section: "Plataforma",
    items: [
      {
        title: "Comissão",
        url: "/dashboard/platform",
        icon: Wallet,
        exact: true,
        permission: "platform.revenue.read",
      },
      {
        title: "Erros e alertas",
        url: "/dashboard/platform/events",
        icon: AlertTriangle,
        permission: "platform.events.read",
      },
    ],
  },
];

export type SettingsGroup = "Loja" | "Integrações" | "Conta"

export interface SettingsTab {
  href: string
  label: string
  /** Prefixo que activa o separador; omitir usa correspondência exacta. */
  prefix?: string
  permission: Permission
  /** Omitir deixa o separador fora dos grupos (a visão geral). */
  group?: SettingsGroup
  description?: string
  icon?: LucideIcon
}

export const SETTINGS_GROUPS: SettingsGroup[] = ["Loja", "Integrações", "Conta"]

/**
 * O Page Builder não está aqui: é conteúdo, vive na sidebar. A rota continua
 * debaixo de /dashboard/settings e herda o guard `settings.read` do layout.
 */
export const SETTINGS_TABS: SettingsTab[] = [
  { href: "/dashboard/settings", label: "Visão geral", permission: "settings.read" },
  {
    href: "/dashboard/settings/store",
    label: "Loja",
    prefix: "/dashboard/settings/store",
    permission: "settings.read",
    group: "Loja",
    description: "Nome, logotipo, contactos e imagens SEO",
    icon: Store,
  },
  {
    href: "/dashboard/settings/appearance",
    label: "Aparência",
    prefix: "/dashboard/settings/appearance",
    permission: "settings.write",
    group: "Loja",
    description: "Cores, tipografia e layout da loja pública",
    icon: Palette,
  },
  {
    href: "/dashboard/settings/shipping",
    label: "Envios",
    prefix: "/dashboard/settings/shipping",
    permission: "settings.write",
    group: "Loja",
    description: "Tarifas por ilha e valor de compra",
    icon: Truck,
  },
  {
    href: "/dashboard/settings/maintenance",
    label: "Manutenção",
    prefix: "/dashboard/settings/maintenance",
    permission: "settings.write",
    group: "Loja",
    description: "Fechar a loja pública e mensagem aos clientes",
    icon: Construction,
  },
  {
    href: "/dashboard/settings/integrations/meta",
    label: "Meta",
    prefix: "/dashboard/settings/integrations",
    permission: "marketing.analytics.read",
    group: "Integrações",
    description: "Pixel, Conversions API, catálogo e tracking",
    icon: Megaphone,
  },
  {
    href: "/dashboard/settings/notifications",
    label: "Notificações",
    prefix: "/dashboard/settings/notifications",
    permission: "settings.notifications.write",
    group: "Integrações",
    description: "Alertas de pedidos no Telegram",
    icon: Bell,
  },
  {
    href: "/dashboard/settings/team",
    label: "Equipa",
    prefix: "/dashboard/settings/team",
    permission: "team.read",
    group: "Conta",
    description: "Convidar membros e gerir funções de acesso",
    icon: Users,
  },
  {
    href: "/dashboard/settings/security",
    label: "Segurança",
    prefix: "/dashboard/settings/security",
    permission: "security.tokens.read",
    group: "Conta",
    description: "Tokens de API",
    icon: Shield,
  },
]

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
