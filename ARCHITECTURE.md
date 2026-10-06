# Arquitetura Next.js – Kumpra Fácil Admin

Estrutura do projeto com foco em **Server Components**, **Server Actions**, **Auth0** e organização clara de componentes, actions e hooks.

## Princípios

- **Server-first**: páginas e dados no servidor; cliente apenas quando necessário (formulários, modais, interatividade).
- **Autenticação e permissões**: o Auth0 autentica, a API autoriza. O backoffice recebe as permissões já resolvidas e só desenha a partir delas — ver [docs/AUTHZ.md](./docs/AUTHZ.md).
- **Actions centralizadas**: chamadas ao backend (GraphQL) em `lib/actions/`, com runner server-only.
- **Componentes por domínio**: `components/<domínio>/` com componentes de apresentação e poucos client components.
- **Hooks mínimos**: apenas para lógica de UI (ex.: `use-mobile`, debounce); dados vêm do servidor ou de actions.

---

## Autenticação e permissões

O modelo completo está em [docs/AUTHZ.md](./docs/AUTHZ.md). Resumo do que toca ao código deste repo:

- `proxy.ts` trata das rotas do Auth0 (login, logout, callback, renovação de sessão).
- `app/dashboard/layout.tsx` chama `requireSessionPage()` e passa as permissões ao `PermissionsProvider`.
- Páginas e layouts de rota guardam-se com `requirePermissionPage("<permissão>")`; server actions com `requirePermissionOrThrow`.
- No cliente, `useCan()` esconde o que o utilizador não pode usar. A decisão final é sempre da API.
- `lib/auth/permissions.ts` é gerado (`pnpm permissions:sync`); não editar à mão.

---

## Estrutura de pastas

```
app/
  layout.tsx                 # Root layout (providers, toaster)
  page.tsx                   # Landing / redirect
  dashboard/
    layout.tsx               # Shell: SidebarProvider + AppSidebar + SidebarInset
    page.tsx                 # Dashboard home (server)
    orders/
      page.tsx               # Lista pedidos (server, usa getOrdersPage)
      loading.tsx
      [id]/
        page.tsx             # Detalhe pedido (server, usa getOrderById)
        loading.tsx
    products/
    coupons/
    brands/
    banners/
    categories/

lib/
  auth0.ts                   # Cliente Auth0 (rotas /api/auth/*)
  auth/
    permissions.ts           # Gerado: nomes das permissões (pnpm permissions:sync)
    principal.ts             # getPrincipal(), can()
    requirePermission.ts     # Guards de página e de server action
  nav.ts                     # Sidebar, separadores das definições e permissões de cada um
  theme.ts                   # Tema claro/escuro/sistema
  actions/
    index.ts                 # Re-export das actions
    graphql.ts               # runGraphQL (server-only)
    orders.ts                # getOrdersPage, getOrderById
    # coupons.ts, products.ts, etc. (mesmo padrão)
  graphql/
    <domínio>/
      queries.ts             # DocumentNode (gql`...`)
      mutations.ts
      types.ts
  utils/
  providers/

components/
  layout/
    dashboard-header.tsx      # Breadcrumb + SidebarTrigger (client)
  app-sidebar.tsx
  ui/                        # Primitivos (shadcn)
  orders/
    order-list.tsx           # Apresentação (server)
    order-list-toolbar.tsx   # Busca + refetch (client)
    order-list-skeleton.tsx
    order-pagination.tsx     # Links paginação (client, useSearchParams)
    order-detail.tsx
    order-detail-skeleton.tsx
  products/
  coupons/
  ...

hooks/
  use-mobile.ts              # Só o necessário para UI
```

---

## Fluxo de dados

### Listagem (ex.: Pedidos)

1. **Page (Server)**  
   - Lê `searchParams` (search, page).  
   - Chama `getOrdersPage({ search, page })` (action).  
   - Renderiza `DashboardHeader`, `OrderListToolbar`, `OrderList`, `OrderPagination`.

2. **Action**  
   - `getOrdersPage` em `lib/actions/orders.ts` chama `runGraphQL(CHECKOUT_SESSION_SEARCH, { filter, page })`.  
   - `runGraphQL` em `lib/actions/graphql.ts` faz `fetch` ao gateway (env: `GTW_URL`, `GTW_TOKEN`, `CMS_ACCESS_TOKEN`).  
   - Retorna `{ ok: true, data }` ou `{ ok: false, error }`.

3. **Componentes**  
   - **OrderList**: recebe `orders` e renderiza links para `/dashboard/orders/[id]`.  
   - **OrderListToolbar**: form GET (search) + botão “Tentar novamente” (`router.refresh()`).  
   - **OrderPagination**: usa `useSearchParams()` para montar `?page=N` e `Link`.

### Detalhe (ex.: Pedido por ID)

1. **Page (Server)**  
   - Chama `getOrderById(params.id)`.  
   - Se `notFound`, usa `notFound()`.  
   - Se erro, mostra mensagem + link voltar.  
   - Senão, renderiza `OrderDetail order={order}`.

2. **loading.tsx**  
   - Mostra `OrderDetailSkeleton` (ou equivalente) enquanto a page carrega.

---

## Onde usar Client vs Server

| Caso | Onde |
|------|------|
| Dados iniciais (listagem, detalhe) | Server Component + action |
| Formulário (busca, filtro) | Client: form GET ou Server Action com `useTransition` |
| Modal, dropdown, toggle | Client |
| Breadcrumb + SidebarTrigger | Client (`DashboardHeader`) |
| Tabela/lista só leitura | Server Component |
| Paginação por URL | Server lê `searchParams`; client só para `Link`/`useSearchParams` |

---

## Convenções de UI

- **Cabeçalho de página.** Todas as páginas começam com `DashboardHeader` (breadcrumb). Por baixo:
  - listas usam `PageToolbar` (`components/admin/page-toolbar.tsx`): ícone, título, contagem, pesquisa à direita, filtros extra no `footer`;
  - visão geral e definições usam `PageHeader`;
  - definições juntam `SettingsSubnav`, gerado a partir de `SETTINGS_TABS`.
- **Erros de carregamento** numa lista: `LoadError` (`components/admin/load-error.tsx`).
- **Carregamento:** cada lista server-side tem `loading.tsx` com `ListPageSkeleton` ou `OverviewPageSkeleton` (`components/admin/page-skeletons.tsx`).
- **Cores de estado:** usar os tokens `success`, `warning`, `danger`, `info` e `highlight` (`bg-success-soft`, `text-warning-strong`, `border-danger-border`, `bg-info`…), nunca as cores do Tailwind (`emerald-50`, `amber-700`…). Os tokens estão em `app/globals.css`, com valores para claro e escuro; as cores fixas não mudam com o tema.
- **Tema:** claro, escuro ou sistema, escolhido no menu do utilizador (`lib/theme.ts`). A classe `.dark` vai no `<html>`.
- **Tamanho de texto:** corpo a 14px. Nada abaixo de 10px; 11px só para rótulos em maiúsculas.
- **Formulários grandes** (ex.: editar produto) são páginas, não modais: `/dashboard/products/[id]/edit`, com barra de guardar fixa e aviso de alterações por guardar.

---

## Adicionar um novo domínio (ex.: “Campanhas”)

1. **GraphQL**  
   - `lib/graphql/campaigns/queries.ts`, `mutations.ts`, `types.ts`.

2. **Actions**  
   - `lib/actions/campaigns.ts`:  
     - `getCampaignsPage(params)`, `getCampaignById(id)` (e futuras mutations via Server Actions).  
   - Usar `runGraphQL` de `lib/actions/graphql.ts`.

3. **Componentes**  
   - `components/campaigns/`: list, detail, toolbar, skeletons (server quando possível).

4. **Páginas**  
   - `app/dashboard/campaigns/page.tsx` (server, chama `getCampaignsPage`).  
   - `app/dashboard/campaigns/[id]/page.tsx` (server, chama `getCampaignById`).  
   - `loading.tsx` em cada rota se fizer sentido.

5. **Menu**  
   - Acrescentar a entrada em `NAV_SECTIONS` (ou `SETTINGS_TABS`) em `lib/nav.ts`, com a permissão que a mostra.  
   - Guardar a rota com um `layout.tsx` que chama `requirePermissionPage`.

---

## Variáveis de ambiente

### Auth0 (obrigatório para o admin)

- `AUTH0_SECRET` – chave para encriptar cookies de sessão (ex.: `openssl rand -hex 32`).
- `AUTH0_BASE_URL` – URL base do admin (ex.: `http://localhost:3001` em dev).
- `AUTH0_ISSUER_BASE_URL` ou `AUTH0_DOMAIN` – domínio do tenant Auth0 (ex.: `https://tenant.auth0.com`).
- `AUTH0_CLIENT_ID` – Client ID da aplicação Auth0 (Regular Web Application).
- `AUTH0_CLIENT_SECRET` – Client Secret da aplicação.

No Auth0 Dashboard, registar para esta aplicação: **Allowed Callback URLs** (ex.: `http://localhost:3001/api/auth/callback`), **Allowed Logout URLs** (ex.: `http://localhost:3001`).

### Gateway / Backend

- `GTW_URL` – base URL do gateway.
- `GTW_TOKEN` – path/token do gateway (ex.: `graphql`).
- `CMS_ACCESS_TOKEN` – Bearer token para o gateway.

O runner em `lib/actions/graphql.ts` usa `fetch` a `GTW_URL/GTW_TOKEN` e envia `Authorization: Bearer CMS_ACCESS_TOKEN`.
