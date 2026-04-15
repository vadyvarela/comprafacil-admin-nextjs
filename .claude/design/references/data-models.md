# TypeScript Data Models

## Core Ecommerce Entities

```ts
// lib/types.ts

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
export type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded'
export type PaymentMethod = 'credit_card' | 'pix' | 'boleto' | 'debit_card'

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  avatar?: string
  totalOrders: number
  totalSpent: number        // in cents (BRL)
  lastOrderAt: Date
  createdAt: Date
  address?: Address
}

export interface Address {
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
  country: string
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number             // in cents
  compareAtPrice?: number   // original price (for discounts)
  sku: string
  barcode?: string
  stock: number
  reservedStock: number
  category: string
  tags: string[]
  images: string[]
  status: 'active' | 'draft' | 'archived'
  createdAt: Date
  updatedAt: Date
}

export interface OrderItem {
  id: string
  product: Pick<Product, 'id' | 'name' | 'sku' | 'images'>
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface Order {
  id: string
  orderNumber: string       // e.g., "#1234"
  customer: Pick<Customer, 'id' | 'name' | 'email' | 'phone'>
  items: OrderItem[]
  subtotal: number
  shipping: number
  discount: number
  total: number
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod: PaymentMethod
  shippingAddress: Address
  trackingCode?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface DashboardStats {
  revenue: {
    current: number
    previous: number
    change: number          // percentage
  }
  orders: {
    current: number
    previous: number
    change: number
    byStatus: Record<OrderStatus, number>
  }
  customers: {
    current: number
    new: number
    change: number
  }
  aov: {                    // Average Order Value
    current: number
    previous: number
    change: number
  }
}

export interface RevenueDataPoint {
  date: string              // "2024-01-15"
  revenue: number
  orders: number
}

export interface TopProduct {
  product: Pick<Product, 'id' | 'name' | 'images'>
  sold: number
  revenue: number
  change: number
}
```

## Utility Functions

```ts
// lib/utils.ts (add these)

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100)
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
```
