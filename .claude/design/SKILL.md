---
name: ecommerce-backoffice
description: >
  Design and build modern, production-grade ecommerce backoffice/admin interfaces using Next.js (App Router) and React. Use this skill whenever the user asks to build admin panels, dashboards, order management, product CRUD, inventory tracking, customer management, analytics, or any backoffice/internal tool for ecommerce. Also trigger when the user says "painel admin", "backoffice", "dashboard de vendas", "gestão de pedidos", "CMS de produtos", or any variation. This skill ensures consistently stunning, enterprise-level UI with cohesive dark/light themes, data-dense layouts, and excellent UX for ecommerce operations.
---

# Ecommerce Backoffice Design Skill

Build modern, data-rich admin interfaces for ecommerce platforms using **Next.js 14+ (App Router)** + **TypeScript** + **Tailwind CSS** + **shadcn/ui**.

## Stack Mandatório

```
Next.js 14+ (App Router)
TypeScript
Tailwind CSS
shadcn/ui  → npx shadcn@latest add <component>
Lucide React (ícones)
Recharts (gráficos)
@tanstack/react-table (tabelas avançadas)
```

> Antes de começar: leia `references/components.md` para componentes e `references/design-system.md` para tokens.

---

## Princípios de Design

### Identidade Visual
- **Tema padrão**: Dark theme como primário (profissional, moderno)
- **Palette**: Tons neutros profundos (slate/zinc) + 1 cor de acento vibrante
- **Tipografia**: `Geist` ou `Inter` para dados; `Sora` para headings
- **Bordas**: Sutis, low-contrast (`border-white/[0.08]` no dark)
- **Shadows**: Apenas em cards flutuantes e modais

### Hierarquia de Layout

```
RootLayout
└── AdminLayout
    ├── Sidebar (collapsible, 240px → 64px)
    ├── TopBar (breadcrumb + actions + user avatar)
    └── Main Content
        ├── PageHeader (title + KPI pills + CTA)
        ├── Stats Row (metric cards)
        ├── Content Area (table / kanban / grid)
        └── Drawer/Sheet (detail panels)
```

### Stats Card — padrão obrigatório
Sempre mostrar: valor, label, delta (% vs período anterior), ícone colorido
```tsx
<StatsCard label="Receita Hoje" value="R$ 24.350" delta="+12.4%" trend="up" icon={TrendingUp} accentColor="emerald" />
```

### Data Table — sempre incluir
- Checkbox selection + bulk actions bar
- Column sorting + search + filters inline
- Row hover com quick actions (edit, view, delete)
- Pagination com "Mostrando X de Y"

### Status Badges — sistema de cores
```
pending    → yellow/amber    processing → blue
shipped    → indigo           delivered  → emerald
cancelled  → red              refunded   → orange
```

---

## Módulos — arquivos de referência

| Módulo | Arquivo |
|--------|---------|
| Dashboard / Overview | `references/modules/dashboard.md` |
| Pedidos (Orders) | `references/modules/orders.md` |
| Produtos (Products) | `references/modules/products.md` |
| Clientes (Customers) | `references/modules/customers.md` |
| Estoque (Inventory) | `references/modules/inventory.md` |
| Analytics | `references/modules/analytics.md` |

---

## Estrutura Next.js

```
app/
├── (admin)/
│   ├── layout.tsx          # AdminLayout com sidebar
│   ├── dashboard/page.tsx
│   ├── orders/page.tsx + [id]/page.tsx
│   ├── products/page.tsx + [id]/page.tsx
│   ├── customers/page.tsx
│   └── analytics/page.tsx
components/
├── admin/
│   ├── sidebar.tsx
│   ├── topbar.tsx
│   ├── stats-card.tsx
│   └── data-table.tsx
└── ui/                     # shadcn components
lib/types/                  # order.ts, product.ts, customer.ts
```

---

## Sidebar — navegação padrão

```tsx
const navigation = [
  { name: 'Dashboard',    href: '/dashboard',  icon: LayoutDashboard },
  { name: 'Pedidos',      href: '/orders',     icon: ShoppingCart, badge: 12 },
  { name: 'Produtos',     href: '/products',   icon: Package },
  { name: 'Clientes',     href: '/customers',  icon: Users },
  { name: 'Estoque',      href: '/inventory',  icon: Warehouse },
  { name: 'Analytics',    href: '/analytics',  icon: BarChart3 },
  { name: 'Configurações',href: '/settings',   icon: Settings },
]
```
Sidebar: logo/loja no topo, collapse toggle, active state com accent, badges, avatar no bottom.

---

## Regras de Qualidade

**SEMPRE:**
- Usar `cn()` do shadcn para classes condicionais
- TypeScript tipado (sem `any`)
- Dados mock realistas (não "Item 1")
- Estados: loading skeleton, empty state, error state
- Responsive: sidebar como drawer em mobile
- Formatação BR: `R$`, `DD/MM/YYYY`, `1.234,56`

**NUNCA:**
- Tabelas sem sorting/filtering
- Stats sem delta comparativo
- Dashboards sem filtros de período

---

## CSS Avançado para Beleza Extra

```css
/* Glassmorphism cards no dark */
background: rgba(255,255,255,0.03);
backdrop-filter: blur(12px);
border: 1px solid rgba(255,255,255,0.08);

/* Sidebar active item */
background: linear-gradient(90deg, accent/20% 0%, transparent 100%);
border-left: 2px solid accent;

/* Grid background sutil */
background-image: 
  linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px),
  linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px);
background-size: 32px 32px;
```

---

## Quick Start

1. Identificar o módulo pedido
2. Ler o arquivo de referência correspondente
3. Definir tipos TypeScript + dados mock realistas
4. Construir layout seguindo a hierarquia
5. Adicionar interatividade (filtros, sorting, modais, sheets)
6. Checar regras de qualidade

---

## Tailwind v4 — Notas Críticas

- **Sem `tailwind.config.js`** — tokens vão no `globals.css` via `@theme {}`
- **Sem `darkMode: 'class'`** — usar `@variant dark` no CSS ou `prefers-color-scheme`
- **Tokens custom** → `--color-*`, `--font-*`, `--radius-*` dentro de `@theme`
- **shadcn/ui com Tailwind v4** → usar `npx shadcn@canary` (versão com suporte v4)

```bash
# Instalação correta para este stack
npx shadcn@canary init
npx shadcn@canary add button card badge table dialog sheet
```
