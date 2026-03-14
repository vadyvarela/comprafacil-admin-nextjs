# Arquitetura Next.js – Compra Fácil Admin

Estrutura do projeto com foco em **Server Components**, **Server Actions**, **Auth0** e organização clara de componentes, actions e hooks.

## Princípios

- **Server-first**: páginas e dados no servidor; cliente apenas quando necessário (formulários, modais, interatividade).
- **Autenticação e permissões**: primeira página é login; apenas utilizadores com role **admin** acedem ao dashboard (utilizadores do front não podem aceder).
- **Actions centralizadas**: chamadas ao backend (GraphQL) em `lib/actions/`, com runner server-only.
- **Componentes por domínio**: `components/<domínio>/` com componentes de apresentação e poucos client components.
- **Hooks mínimos**: apenas para lógica de UI (ex.: `use-mobile`, debounce); dados vêm do servidor ou de actions.

---

## Autenticação (Auth0)

- **Primeira página** (`/`): se não houver sessão, mostra ecrã de login com link para `/api/auth/login`. Se houver sessão e o utilizador tiver role **admin**, redireciona para `/dashboard`. Caso contrário, redireciona para `/unauthorized`.
- **Dashboard** (`/dashboard/*`): o `dashboard/layout.tsx` é um Server Component que chama `auth0.getSession()`. Sem sessão → redirect para `/api/auth/login`. Com sessão mas sem role admin → redirect para `/unauthorized`.
- **Permissões**: em `lib/auth/config.ts` define-se `ADMIN_ROLE` (ex.: `"admin"`) e `ROLE_CLAIM` (claim do token onde o Auth0 envia as roles, ex.: `https://comprafacil.com/roles`). A função `hasAdminRole(user)` verifica se o utilizador tem permissão.
- **Auth0**: middleware em `middleware.ts` usa `auth0.middleware(request)` para tratar login, logout, callback e renovação de sessão. Rotas de auth: `/api/auth/login`, `/api/auth/logout`, `/api/auth/callback`.
- **Configuração no Auth0**: criar uma Action (ou Rule) que adicione ao token um claim com as roles do utilizador (ex.: `app_metadata.roles` ou custom claim `https://comprafacil.com/roles` com valor `["admin"]`). Utilizadores do front devem ter apenas role `customer` ou nenhuma; apenas utilizadores com `admin` acedem ao backoffice.

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
    config.ts                # ADMIN_ROLE, ROLE_CLAIM, hasAdminRole()
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
   - Incluir item em `components/app-sidebar.tsx`.

---

## Variáveis de ambiente

### Auth0 (obrigatório para o admin)

- `AUTH0_SECRET` – chave para encriptar cookies de sessão (ex.: `openssl rand -hex 32`).
- `AUTH0_BASE_URL` – URL base do admin (ex.: `http://localhost:3001` em dev).
- `AUTH0_ISSUER_BASE_URL` ou `AUTH0_DOMAIN` – domínio do tenant Auth0 (ex.: `https://tenant.auth0.com`).
- `AUTH0_CLIENT_ID` – Client ID da aplicação Auth0 (Regular Web Application).
- `AUTH0_CLIENT_SECRET` – Client Secret da aplicação.
- `AUTH0_ADMIN_ROLE` – (opcional) Nome da role que permite acesso ao admin. Default: `admin`.
- `AUTH0_ROLE_CLAIM` – (opcional) Claim do token onde vêm as roles. Default: `https://comprafacil.com/roles`.

No Auth0 Dashboard, registar para esta aplicação: **Allowed Callback URLs** (ex.: `http://localhost:3001/api/auth/callback`), **Allowed Logout URLs** (ex.: `http://localhost:3001`).

### Gateway / Backend

- `GTW_URL` – base URL do gateway.
- `GTW_TOKEN` – path/token do gateway (ex.: `graphql`).
- `CMS_ACCESS_TOKEN` – Bearer token para o gateway.

O runner em `lib/actions/graphql.ts` usa `fetch` a `GTW_URL/GTW_TOKEN` e envia `Authorization: Bearer CMS_ACCESS_TOKEN`.
