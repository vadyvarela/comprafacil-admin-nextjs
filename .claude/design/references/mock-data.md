# Mock Data Reference

## Complete Mock Dataset

```ts
// lib/mock-data.ts
import { Order, Customer, Product, DashboardStats, RevenueDataPoint, TopProduct } from './types'

export const mockCustomers: Customer[] = [
  {
    id: 'cust_001',
    name: 'Ana Paula Ferreira',
    email: 'ana.ferreira@gmail.com',
    phone: '(11) 99123-4567',
    totalOrders: 12,
    totalSpent: 489700,
    lastOrderAt: new Date('2024-01-14'),
    createdAt: new Date('2023-03-20'),
  },
  {
    id: 'cust_002',
    name: 'Carlos Eduardo Santos',
    email: 'carlos.santos@outlook.com',
    phone: '(21) 98765-4321',
    totalOrders: 7,
    totalSpent: 234500,
    lastOrderAt: new Date('2024-01-12'),
    createdAt: new Date('2023-06-15'),
  },
  {
    id: 'cust_003',
    name: 'Mariana Costa Lima',
    email: 'mari.lima@yahoo.com.br',
    phone: '(31) 97654-3210',
    totalOrders: 23,
    totalSpent: 1234800,
    lastOrderAt: new Date('2024-01-15'),
    createdAt: new Date('2022-11-08'),
  },
  {
    id: 'cust_004',
    name: 'Roberto Alves Pereira',
    email: 'r.alves@empresa.com.br',
    phone: '(41) 96543-2109',
    totalOrders: 4,
    totalSpent: 89900,
    lastOrderAt: new Date('2024-01-10'),
    createdAt: new Date('2023-09-22'),
  },
  {
    id: 'cust_005',
    name: 'Fernanda Oliveira Souza',
    email: 'fernanda.os@gmail.com',
    phone: '(51) 95432-1098',
    totalOrders: 18,
    totalSpent: 756300,
    lastOrderAt: new Date('2024-01-13'),
    createdAt: new Date('2023-01-05'),
  },
]

export const mockProducts: Product[] = [
  {
    id: 'prod_001',
    name: 'Tênis Running Pro X3',
    slug: 'tenis-running-pro-x3',
    description: 'Tênis de alta performance para corrida',
    price: 39900,
    compareAtPrice: 49900,
    sku: 'TEN-RUN-X3-42',
    stock: 47,
    reservedStock: 3,
    category: 'Calçados',
    tags: ['esporte', 'corrida', 'masculino'],
    images: ['/products/tenis-1.jpg'],
    status: 'active',
    createdAt: new Date('2023-08-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'prod_002',
    name: 'Camiseta Dry Fit Premium',
    slug: 'camiseta-dry-fit-premium',
    description: 'Camiseta respirável para treinos intensos',
    price: 8990,
    sku: 'CAM-DRY-PM-M',
    stock: 134,
    reservedStock: 8,
    category: 'Roupas',
    tags: ['esporte', 'treino', 'unissex'],
    images: ['/products/camiseta-1.jpg'],
    status: 'active',
    createdAt: new Date('2023-09-15'),
    updatedAt: new Date('2024-01-05'),
  },
  {
    id: 'prod_003',
    name: 'Mochila Urbana 30L',
    slug: 'mochila-urbana-30l',
    description: 'Mochila resistente para o dia a dia',
    price: 15990,
    compareAtPrice: 19990,
    sku: 'MOC-URB-30-PT',
    stock: 0,
    reservedStock: 0,
    category: 'Acessórios',
    tags: ['urbano', 'trabalho', 'escola'],
    images: ['/products/mochila-1.jpg'],
    status: 'active',
    createdAt: new Date('2023-07-20'),
    updatedAt: new Date('2024-01-08'),
  },
]

export const mockOrders: Order[] = [
  {
    id: 'ord_001',
    orderNumber: '#4832',
    customer: { id: 'cust_003', name: 'Mariana Costa Lima', email: 'mari.lima@yahoo.com.br', phone: '(31) 97654-3210' },
    items: [
      { id: 'item_001', product: { id: 'prod_001', name: 'Tênis Running Pro X3', sku: 'TEN-RUN-X3-42', images: [] }, quantity: 1, unitPrice: 39900, totalPrice: 39900 },
    ],
    subtotal: 39900,
    shipping: 1500,
    discount: 0,
    total: 41400,
    status: 'shipped',
    paymentStatus: 'paid',
    paymentMethod: 'credit_card',
    shippingAddress: { street: 'Rua das Flores', number: '123', neighborhood: 'Centro', city: 'Belo Horizonte', state: 'MG', zipCode: '30130-110', country: 'BR' },
    trackingCode: 'BR123456789BR',
    createdAt: new Date('2024-01-14T10:30:00'),
    updatedAt: new Date('2024-01-15T08:00:00'),
  },
  {
    id: 'ord_002',
    orderNumber: '#4831',
    customer: { id: 'cust_001', name: 'Ana Paula Ferreira', email: 'ana.ferreira@gmail.com', phone: '(11) 99123-4567' },
    items: [
      { id: 'item_002', product: { id: 'prod_002', name: 'Camiseta Dry Fit Premium', sku: 'CAM-DRY-PM-M', images: [] }, quantity: 3, unitPrice: 8990, totalPrice: 26970 },
    ],
    subtotal: 26970,
    shipping: 0,
    discount: 2697,
    total: 24273,
    status: 'processing',
    paymentStatus: 'paid',
    paymentMethod: 'pix',
    shippingAddress: { street: 'Av. Paulista', number: '1000', neighborhood: 'Bela Vista', city: 'São Paulo', state: 'SP', zipCode: '01310-100', country: 'BR' },
    createdAt: new Date('2024-01-14T09:15:00'),
    updatedAt: new Date('2024-01-14T09:20:00'),
  },
  {
    id: 'ord_003',
    orderNumber: '#4830',
    customer: { id: 'cust_005', name: 'Fernanda Oliveira Souza', email: 'fernanda.os@gmail.com', phone: '(51) 95432-1098' },
    items: [
      { id: 'item_003', product: { id: 'prod_003', name: 'Mochila Urbana 30L', sku: 'MOC-URB-30-PT', images: [] }, quantity: 1, unitPrice: 15990, totalPrice: 15990 },
    ],
    subtotal: 15990,
    shipping: 2000,
    discount: 0,
    total: 17990,
    status: 'pending',
    paymentStatus: 'pending',
    paymentMethod: 'boleto',
    shippingAddress: { street: 'Rua XV de Novembro', number: '500', neighborhood: 'Centro', city: 'Porto Alegre', state: 'RS', zipCode: '90020-080', country: 'BR' },
    createdAt: new Date('2024-01-14T08:45:00'),
    updatedAt: new Date('2024-01-14T08:45:00'),
  },
]

export const mockDashboardStats: DashboardStats = {
  revenue:   { current: 8432500, previous: 7210000, change: 16.9 },
  orders:    { current: 847, previous: 756, change: 12.0, byStatus: { pending: 24, processing: 47, shipped: 89, delivered: 651, cancelled: 31, refunded: 5 } },
  customers: { current: 3241, new: 187, change: 8.4 },
  aov:       { current: 9956, previous: 9537, change: 4.4 },
}

export const mockRevenueData: RevenueDataPoint[] = [
  { date: '2024-01-01', revenue: 245000, orders: 24 },
  { date: '2024-01-02', revenue: 312000, orders: 31 },
  { date: '2024-01-03', revenue: 189000, orders: 19 },
  { date: '2024-01-04', revenue: 278000, orders: 27 },
  { date: '2024-01-05', revenue: 421000, orders: 42 },
  { date: '2024-01-06', revenue: 389000, orders: 39 },
  { date: '2024-01-07', revenue: 456000, orders: 45 },
  { date: '2024-01-08', revenue: 334000, orders: 33 },
  { date: '2024-01-09', revenue: 298000, orders: 30 },
  { date: '2024-01-10', revenue: 512000, orders: 51 },
  { date: '2024-01-11', revenue: 487000, orders: 48 },
  { date: '2024-01-12', revenue: 623000, orders: 62 },
  { date: '2024-01-13', revenue: 534000, orders: 53 },
  { date: '2024-01-14', revenue: 698000, orders: 69 },
]

export const mockTopProducts: TopProduct[] = [
  { product: { id: 'prod_001', name: 'Tênis Running Pro X3', images: [] }, sold: 234, revenue: 9331200, change: 23.4 },
  { product: { id: 'prod_002', name: 'Camiseta Dry Fit Premium', images: [] }, sold: 456, revenue: 4099440, change: 8.7 },
  { product: { id: 'prod_003', name: 'Mochila Urbana 30L', images: [] }, sold: 89, revenue: 1423110, change: -2.1 },
]
```
