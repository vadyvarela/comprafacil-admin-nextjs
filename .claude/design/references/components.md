# Componentes Reutilizáveis

## StatsCard

```tsx
// components/admin/stats-card.tsx
interface StatsCardProps {
  label: string
  value: string
  delta: string
  trend: 'up' | 'down' | 'neutral'
  icon: LucideIcon
  accentColor: 'emerald' | 'blue' | 'violet' | 'amber' | 'rose'
  period?: string
}

const accentMap = {
  emerald: 'text-emerald-400 bg-emerald-400/10',
  blue:    'text-blue-400 bg-blue-400/10',
  violet:  'text-violet-400 bg-violet-400/10',
  amber:   'text-amber-400 bg-amber-400/10',
  rose:    'text-rose-400 bg-rose-400/10',
}

export function StatsCard({ label, value, delta, trend, icon: Icon, accentColor, period = 'vs ontem' }: StatsCardProps) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-zinc-400">{label}</span>
        <div className={cn("p-2 rounded-lg", accentMap[accentColor])}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-semibold font-mono tracking-tight text-white">{value}</p>
        <div className="flex items-center gap-1.5">
          {trend === 'up' ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> : <TrendingDown className="w-3.5 h-3.5 text-rose-400" />}
          <span className={cn("text-xs font-medium", trend === 'up' ? 'text-emerald-400' : 'text-rose-400')}>{delta}</span>
          <span className="text-xs text-zinc-500">{period}</span>
        </div>
      </div>
    </div>
  )
}
```

## PageHeader

```tsx
// components/admin/page-header.tsx
interface PageHeaderProps {
  title: string
  description?: string
  children?: React.ReactNode  // botões de ação
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between pb-6 border-b border-white/[0.08]">
      <div>
        <h1 className="text-xl font-semibold text-white">{title}</h1>
        {description && <p className="text-sm text-zinc-400 mt-0.5">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}
```

## StatusBadge

```tsx
// components/admin/status-badge.tsx
const statusConfig = {
  pending:    { label: 'Pendente',     className: 'bg-amber-400/10 text-amber-400 border-amber-400/20' },
  processing: { label: 'Processando', className: 'bg-blue-400/10 text-blue-400 border-blue-400/20' },
  shipped:    { label: 'Enviado',      className: 'bg-violet-400/10 text-violet-400 border-violet-400/20' },
  delivered:  { label: 'Entregue',    className: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' },
  cancelled:  { label: 'Cancelado',   className: 'bg-rose-400/10 text-rose-400 border-rose-400/20' },
  refunded:   { label: 'Reembolsado', className: 'bg-orange-400/10 text-orange-400 border-orange-400/20' },
}

export function StatusBadge({ status }: { status: keyof typeof statusConfig }) {
  const config = statusConfig[status]
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border", config.className)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {config.label}
    </span>
  )
}
```

## DataTable wrapper (com @tanstack/react-table)

```tsx
// Estrutura base — adaptar conforme os dados
import { useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel } from '@tanstack/react-table'

// Pattern para bulk actions
const [rowSelection, setRowSelection] = useState({})
const selectedCount = Object.keys(rowSelection).length

// Bulk actions bar — aparece quando selectedCount > 0
{selectedCount > 0 && (
  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/10 border border-accent/20">
    <span className="text-sm text-accent">{selectedCount} selecionados</span>
    <Separator orientation="vertical" className="h-4" />
    <Button variant="ghost" size="sm">Exportar</Button>
    <Button variant="ghost" size="sm" className="text-rose-400">Excluir</Button>
  </div>
)}
```

## AdminLayout com Sidebar

```tsx
// app/(admin)/layout.tsx
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  
  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

## Dados Mock Realistas — Pedidos

```tsx
const mockOrders: Order[] = [
  { id: '#BR-10432', customer: 'Ana Carolina Silva', email: 'ana@email.com', 
    items: 3, total: 'R$ 459,90', status: 'delivered', date: '14/04/2025', 
    payment: 'Cartão crédito' },
  { id: '#BR-10431', customer: 'João Pedro Martins', email: 'joao@email.com',
    items: 1, total: 'R$ 89,00', status: 'processing', date: '14/04/2025',
    payment: 'PIX' },
  // ... mais 20+ itens
]
```
