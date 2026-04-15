# Módulo: Clientes (Customers)

## Lista de Clientes
Colunas: Avatar+Nome | Email | Pedidos | Total Gasto | Última Compra | Cadastro | Status | Ações

### KPIs no topo
- Total clientes | Novos este mês | Clientes ativos | Valor médio de vida (LTV)

## Perfil do Cliente (Sheet ou /customers/[id])
```
Header: Avatar + Nome + email + telefone + badges (VIP, Recorrente, etc.)
Tabs:
  Visão Geral: Stats (total pedidos, gasto total, ticket médio, última compra)
  Pedidos:     mini tabela de todos os pedidos do cliente
  Endereços:   lista de endereços salvos
  Notas:       notas internas da equipe
```

## Segmentação (chips filtrável)
- Todos | VIP (>5 pedidos) | Novos (<30 dias) | Inativos (>90 dias) | Em risco

## Tipos
```tsx
interface Customer {
  id: string
  name: string
  email: string
  phone: string
  avatar?: string
  totalOrders: number
  totalSpent: number
  averageOrderValue: number
  lastOrderDate: string
  registeredAt: string
  status: 'active' | 'inactive'
  tags: string[]  // 'vip', 'new', 'at-risk'
  addresses: Address[]
}
```
