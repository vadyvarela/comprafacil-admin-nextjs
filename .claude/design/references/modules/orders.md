# Módulo: Pedidos (Orders)

## Lista de Pedidos
Layout: PageHeader + Stats rápidos + Filters Row + DataTable + Pagination

### Filtros obrigatórios
- Search por ID, nome, email
- Select: Status (todos/pending/processing/shipped/delivered/cancelled)
- DateRangePicker: período
- Select: Método de pagamento

### Colunas da tabela
| Checkbox | ID | Cliente | Itens | Total | Status | Pagamento | Data | Ações |

### Ações por linha (hover reveal)
- Olho (ver detalhe) → abre Sheet lateral
- Imprimir etiqueta
- Cancelar pedido

### Bulk actions (quando selecionados)
- Exportar CSV
- Atualizar status em massa
- Imprimir etiquetas selecionadas

## Detalhe do Pedido (Sheet lateral ou page /orders/[id])

```
Header: #ID + StatusBadge + botões de ação
├── Seção: Resumo do Pedido
│   └── Lista de produtos (img + nome + qtd + preço)
├── Seção: Informações do Cliente
│   └── Nome, email, telefone, link para perfil
├── Seção: Endereço de Entrega
├── Seção: Pagamento
│   └── Método, status, ID da transação
├── Seção: Timeline de Status
│   └── Stepper visual: Recebido → Processando → Enviado → Entregue
└── Seção: Notas Internas (textarea editável)
```

## Tipos TypeScript
```tsx
interface Order {
  id: string              // '#BR-10432'
  customer: {
    name: string
    email: string
    phone: string
    avatar?: string
  }
  items: OrderItem[]
  subtotal: number
  shipping: number
  discount: number
  total: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  payment: { method: string; status: string; transactionId: string }
  shippingAddress: Address
  timeline: StatusEvent[]
  notes: string
  createdAt: string
  updatedAt: string
}
```
