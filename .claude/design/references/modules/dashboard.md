# Módulo: Dashboard

## Layout
```
PageHeader "Visão Geral" + DateRangePicker + "Exportar" button
Stats Row (4 cards):  Receita Total | Pedidos Hoje | Ticket Médio | Clientes Novos
Charts Row (2 cols):  LineChart Receita 30d (2/3) | Donut Top Canais (1/3)
Bottom Row (2 cols):  Tabela Pedidos Recentes (2/3) | Lista Produtos Top (1/3)
```

## KPIs obrigatórios
- Receita Total (com delta % vs período anterior)
- Total de Pedidos
- Ticket Médio
- Taxa de Conversão ou Clientes Novos

## Gráfico de Receita (Recharts)
```tsx
// LineChart com gradiente preenchido
<AreaChart data={revenueData}>
  <defs>
    <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
    </linearGradient>
  </defs>
  <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#revenue)" strokeWidth={2} />
</AreaChart>
```

## Pedidos Recentes — mini tabela
Colunas: ID | Cliente | Status | Valor | Data | (ações rápidas)
Máx 8 linhas, link "Ver todos" no rodapé

## Dados mock para dashboard
```tsx
const revenueData = [
  { date: '01/04', revenue: 12400, orders: 43 },
  { date: '02/04', revenue: 15800, orders: 61 },
  { date: '03/04', revenue: 9200, orders: 38 },
  // ... 30 dias
]
const topProducts = [
  { name: 'Tênis Air Max Classic', sold: 142, revenue: 'R$ 21.280', img: '...' },
  // ...
]
```
