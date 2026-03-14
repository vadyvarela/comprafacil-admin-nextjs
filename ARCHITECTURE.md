# Arquitetura Next.js – TechStore Backoffice

Estrutura do projeto com foco em **Server Components**, **Server Actions** e organização clara de componentes, actions e hooks.

## Princípios

- **Server-first**: páginas e dados no servidor; cliente apenas quando necessário (formulários, modais, interatividade).
- **Actions centralizadas**: chamadas ao backend (GraphQL) em `lib/actions/`, com runner server-only.
- **Componentes por domínio**: `components/<domínio>/` com componentes de apresentação e poucos client components.
- **Hooks mínimos**: apenas para lógica de UI (ex.: `use-mobile`, debounce); dados vêm do servidor ou de actions.

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

- `GTW_URL` – base URL do gateway.  
- `GTW_TOKEN` – path/token do gateway (ex.: `graphql`).  
- `CMS_ACCESS_TOKEN` – Bearer token para o gateway.

O runner em `lib/actions/graphql.ts` usa `fetch` a `GTW_URL/GTW_TOKEN` e envia `Authorization: Bearer CMS_ACCESS_TOKEN`.
