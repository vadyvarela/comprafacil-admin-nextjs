# Módulo: Analytics

## Layout
```
DateRangePicker + Compare toggle (vs período anterior)
Row 1: KPIs principais (Receita, Pedidos, Conversão, AOV)
Row 2: Gráfico receita ao longo do tempo (AreaChart full width)
Row 3: 
  ├── Vendas por categoria (BarChart horizontal)
  └── Top 5 produtos (lista com progress bar)
Row 4:
  ├── Mapa de calor horário de pedidos
  └── Funil de conversão
```

## Gráficos com Recharts

```tsx
// Revenue over time — AreaChart com tooltip customizado
// Sales by category — BarChart horizontal
// Order status distribution — PieChart / RadialBarChart
// Hourly heatmap — ScatterChart ou grid manual de cells coloridas

// Tooltip customizado (sempre fazer):
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-white/[0.08] bg-zinc-900 p-3 shadow-xl">
      <p className="text-xs text-zinc-400 mb-1">{label}</p>
      <p className="text-sm font-semibold text-white">{formatCurrency(payload[0].value)}</p>
    </div>
  )
}
```

## Métricas a sempre incluir
- Receita bruta e líquida (com devoluções)
- Taxa de conversão (visitantes → compra)
- Average Order Value (AOV)
- Customer Acquisition Cost (CAC) se disponível
- Repeat purchase rate
