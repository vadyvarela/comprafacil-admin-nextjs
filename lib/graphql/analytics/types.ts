export interface SalesReport {
  totalRevenue: number
  totalProductSold: number
}

export interface PaymentStatusSummary {
  status: { code: string; description: string }
  quantity: number
}

export interface WeekPurchaseReportItem {
  date: string
  totalSales: number
  totalRevenue: number
}

export interface ProductSalesReportItem {
  productId: string
  productTitle: string
  totalSold: number
  totalRevenue: number
}

export interface CustomerPurchasesItem {
  customerId: string | null
  customerName: string | null
  totalSales: number
}

export interface CountryPurchasesItem {
  countryName: string
  totalSales: number
}

export interface PaymentSummaryItem {
  paymentId: string
  merchantReference: string | null
  paymentDate: string | null
  currency: string | null
  customer: {
    id: string | null
    name: string | null
    email: string | null
  } | null
  items: Array<{
    product: string | null
    variant: string | null
    quantity: number | null
    itemTotal: number | null
  }> | null
}

export interface PaginatedResponse<T> {
  data: T[]
  totalElements: number
}

export interface AnalyticsReportData {
  period: {
    from: Date
    to: Date
    label: string
  }
  kpis: {
    revenue: { current: number; previous: number }
    orders: { current: number; previous: number }
    customers: { current: number; previous: number }
    aov: { current: number; previous: number }
  }
  chartData: Array<{
    label: string
    revenue: number
    orders: number
  }>
  chartGranularity: "daily" | "monthly"
  topProducts: Array<{
    name: string
    revenue: number
    qty: number
  }>
  topCustomers: Array<{
    name: string
    revenue: number
  }>
  countries: Array<{
    name: string
    sales: number
  }>
  paymentStatus: Array<{
    code: string
    label: string
    quantity: number
  }>
  recentPayments: Array<{
    id: string
    customerName: string
    amount: number
    currency: string
    date: string | null
    reference: string | null
  }>
}
