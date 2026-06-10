import "server-only"
import { format, parseISO, startOfDay, subDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { runGraphQL } from "./graphql"
import { getTransactions } from "./transactions"
import {
  ANALYTICS_SALES_SUMMARY,
  ANALYTICS_PAYMENT_STATUS,
  ANALYTICS_WEEK_PURCHASE_REPORT,
  ANALYTICS_LAST_SIX_MONTHS_REPORT,
  ANALYTICS_PRODUCT_SALES_REPORT,
  ANALYTICS_CUSTOMER_PURCHASES,
  ANALYTICS_COUNTRY_PURCHASES,
  ANALYTICS_SUCCESSFUL_PAYMENTS,
} from "@/lib/graphql/analytics/queries"
import type {
  AnalyticsReportData,
  SalesReport,
  PaymentStatusSummary,
  WeekPurchaseReportItem,
  ProductSalesReportItem,
  CustomerPurchasesItem,
  CountryPurchasesItem,
  PaymentSummaryItem,
} from "@/lib/graphql/analytics/types"
import {
  resolveAnalyticsPeriod,
  previousPeriod,
  periodLabel,
  isWeekPresetPeriod,
  type AnalyticsPeriod,
} from "@/lib/analytics/period"
import { minorToMajorCurrencyAmount } from "@/lib/utils/currency"

const SUCCESS_STATUS = "PS"
const MAX_PAYMENT_PAGES = 10
const PAYMENT_PAGE_SIZE = 200

export type GetAnalyticsReportResult =
  | { ok: true; data: AnalyticsReportData }
  | { ok: false; error: string }

function toMajorRevenue(value: number | null | undefined): number {
  return minorToMajorCurrencyAmount(value ?? 0)
}

function parseCountrySales(value: string | number | null | undefined): number {
  if (value == null) return 0
  const n = typeof value === "string" ? parseFloat(value) : value
  return toMajorRevenue(Number.isFinite(n) ? n : 0)
}

async function fetchSalesSummary(period: AnalyticsPeriod): Promise<SalesReport | null> {
  const result = await runGraphQL<{ salesSummary: SalesReport | null }>(
    ANALYTICS_SALES_SUMMARY,
    {
      filter: {
        startDate: period.startDate,
        endDate: period.endDate,
        days: null,
        productId: null,
        productVariantId: null,
      },
    }
  )
  if (result.errors?.length) return null
  return result.data?.salesSummary ?? null
}

async function fetchPaymentStatus(): Promise<PaymentStatusSummary[]> {
  const result = await runGraphQL<{ paymentStatusSummary: PaymentStatusSummary[] }>(
    ANALYTICS_PAYMENT_STATUS
  )
  if (result.errors?.length) return []
  return result.data?.paymentStatusSummary ?? []
}

async function fetchWeekReport(): Promise<WeekPurchaseReportItem[]> {
  const result = await runGraphQL<{ weekPurchaseReport: WeekPurchaseReportItem[] }>(
    ANALYTICS_WEEK_PURCHASE_REPORT,
    { filter: { status: SUCCESS_STATUS } }
  )
  if (result.errors?.length) return []
  return result.data?.weekPurchaseReport ?? []
}

async function fetchSixMonthsReport(): Promise<WeekPurchaseReportItem[]> {
  const result = await runGraphQL<{
    lastSixMonthsPurchaseReport: WeekPurchaseReportItem[]
  }>(ANALYTICS_LAST_SIX_MONTHS_REPORT, { filter: { status: SUCCESS_STATUS } })
  if (result.errors?.length) return []
  return result.data?.lastSixMonthsPurchaseReport ?? []
}

async function fetchProductSales(period: AnalyticsPeriod): Promise<ProductSalesReportItem[]> {
  const result = await runGraphQL<{ productSalesReport: ProductSalesReportItem[] }>(
    ANALYTICS_PRODUCT_SALES_REPORT,
    {
      filter: {
        dateStart: period.startDate,
        dateEnd: period.endDate,
        productId: null,
        productVariantId: null,
        country: null,
        search: null,
      },
    }
  )
  if (result.errors?.length) return []
  return result.data?.productSalesReport ?? []
}

async function fetchCustomerPurchases(
  period: AnalyticsPeriod
): Promise<{ items: CustomerPurchasesItem[]; totalElements: number }> {
  const result = await runGraphQL<{
    customerPurchasesSummary: {
      data: CustomerPurchasesItem[]
      totalElements: number
    }
  }>(ANALYTICS_CUSTOMER_PURCHASES, {
    filter: {
      startDate: period.startDate,
      endDate: period.endDate,
      days: null,
      productId: null,
      productVariantId: null,
      customerId: null,
    },
    page: { page: 0, size: 50, sortBy: null, sortDirection: null },
  })
  if (result.errors?.length) return { items: [], totalElements: 0 }
  const node = result.data?.customerPurchasesSummary
  return {
    items: node?.data ?? [],
    totalElements: node?.totalElements ?? 0,
  }
}

async function fetchCountryPurchases(period: AnalyticsPeriod): Promise<CountryPurchasesItem[]> {
  const result = await runGraphQL<{
    countryPurchasesSummary: { data: CountryPurchasesItem[] }
  }>(ANALYTICS_COUNTRY_PURCHASES, {
    filter: {
      startDate: period.startDate,
      endDate: period.endDate,
      productId: null,
      productVariantId: null,
      country: null,
    },
    page: { page: 0, size: 50, sortBy: null, sortDirection: null },
  })
  if (result.errors?.length) return []
  return result.data?.countryPurchasesSummary?.data ?? []
}

async function fetchRecentPayments(period: AnalyticsPeriod): Promise<PaymentSummaryItem[]> {
  const result = await runGraphQL<{
    successfulPaymentSummary: { data: PaymentSummaryItem[] }
  }>(ANALYTICS_SUCCESSFUL_PAYMENTS, {
    filter: {
      startDate: period.startDate,
      endDate: period.endDate,
      days: null,
      productId: null,
      productVariantId: null,
      customerId: null,
    },
    page: {
      page: 0,
      size: 8,
      sortBy: "paymentDate",
      sortDirection: "DESC",
    },
  })
  if (result.errors?.length) return []
  return result.data?.successfulPaymentSummary?.data ?? []
}

async function fetchPaymentsForChart(period: AnalyticsPeriod) {
  const all: Array<{ createdAt: string; amount: number }> = []
  let page = 0
  let totalPages = 1

  while (page < totalPages && page < MAX_PAYMENT_PAGES) {
    const res = await getTransactions({
      page: {
        page,
        size: PAYMENT_PAGE_SIZE,
        sortBy: "createdAt",
        sortDirection: "ASC",
      },
      filter: {
        dateFrom: period.startDate,
        dateTo: period.endDate,
        status: SUCCESS_STATUS,
      },
    })
    if (!res.ok) break
    for (const tx of res.data.data) {
      if (tx.createdAt && tx.amount) {
        all.push({ createdAt: tx.createdAt, amount: tx.amount })
      }
    }
    totalPages = res.data.totalPages ?? 1
    page++
  }

  return all
}

function buildDailyBuckets(
  period: AnalyticsPeriod,
  payments: Array<{ createdAt: string; amount: number }>
) {
  const days = Array.from({ length: period.dayCount }, (_, i) => {
    const date = startOfDay(subDays(period.to, period.dayCount - 1 - i))
    return {
      date,
      label: format(date, "dd/MM", { locale: ptBR }),
      revenue: 0,
      orders: 0,
    }
  })

  for (const payment of payments) {
    const txDate = startOfDay(new Date(payment.createdAt))
    const dayEntry = days.find((d) => d.date.getTime() === txDate.getTime())
    if (dayEntry) {
      dayEntry.revenue += toMajorRevenue(payment.amount)
      dayEntry.orders++
    }
  }

  return days.map(({ label, revenue, orders }) => ({ label, revenue, orders }))
}

function filterReportToPeriod(
  items: WeekPurchaseReportItem[],
  period: AnalyticsPeriod
): WeekPurchaseReportItem[] {
  const fromTime = period.from.getTime()
  const toTime = period.to.getTime()
  return items.filter((item) => {
    const d = startOfDay(parseISO(item.date)).getTime()
    return d >= fromTime && d <= toTime
  })
}

async function buildChartData(
  period: AnalyticsPeriod
): Promise<{ data: AnalyticsReportData["chartData"]; granularity: "daily" | "monthly" }> {
  if (isWeekPresetPeriod(period)) {
    const weekData = filterReportToPeriod(await fetchWeekReport(), period)
    if (weekData.length > 0) {
      return {
        granularity: "daily",
        data: [...weekData]
          .sort((a, b) => a.date.localeCompare(b.date))
          .map((item) => ({
            label: format(parseISO(item.date), "dd/MM", { locale: ptBR }),
            revenue: toMajorRevenue(item.totalRevenue),
            orders: item.totalSales ?? 0,
          })),
      }
    }
  }

  if (period.dayCount > 90) {
    const monthData = filterReportToPeriod(await fetchSixMonthsReport(), period)
    return {
      granularity: "monthly",
      data: [...monthData]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((item) => ({
          label: format(parseISO(item.date), "MMM yyyy", { locale: ptBR }),
          revenue: toMajorRevenue(item.totalRevenue),
          orders: item.totalSales ?? 0,
        })),
    }
  }

  const payments = await fetchPaymentsForChart(period)
  return {
    granularity: "daily",
    data: buildDailyBuckets(period, payments),
  }
}

function paymentTotalAmount(payment: PaymentSummaryItem): number {
  const fromItems = (payment.items ?? []).reduce(
    (sum, item) => sum + toMajorRevenue(item.itemTotal),
    0
  )
  return fromItems
}

export async function getAnalyticsReport(params: {
  from: Date | null
  to: Date | null
}): Promise<GetAnalyticsReportResult> {
  const period = resolveAnalyticsPeriod(params.from, params.to)
  const prev = previousPeriod(period)

  try {
    const [
      currentSales,
      previousSales,
      currentCustomers,
      previousCustomers,
      paymentStatus,
      productSales,
      countryPurchases,
      recentPayments,
      chart,
    ] = await Promise.all([
      fetchSalesSummary(period),
      fetchSalesSummary(prev),
      fetchCustomerPurchases(period),
      fetchCustomerPurchases(prev),
      fetchPaymentStatus(),
      fetchProductSales(period),
      fetchCountryPurchases(period),
      fetchRecentPayments(period),
      buildChartData(period),
    ])

    const revenueCurrent = toMajorRevenue(currentSales?.totalRevenue)
    const revenuePrevious = toMajorRevenue(previousSales?.totalRevenue)
    const ordersCurrent = currentSales?.totalProductSold ?? 0
    const ordersPrevious = previousSales?.totalProductSold ?? 0
    const customersCurrent = currentCustomers.totalElements
    const customersPrevious = previousCustomers.totalElements
    const aovCurrent = ordersCurrent > 0 ? Math.round(revenueCurrent / ordersCurrent) : 0
    const aovPrevious = ordersPrevious > 0 ? Math.round(revenuePrevious / ordersPrevious) : 0

    const topProducts = [...productSales]
      .filter((p) => (p.totalRevenue ?? 0) > 0)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5)
      .map((p) => ({
        name: p.productTitle ?? "Produto",
        revenue: toMajorRevenue(p.totalRevenue),
        qty: p.totalSold ?? 0,
      }))

    const topCustomers = [...currentCustomers.items]
      .sort((a, b) => (b.totalSales ?? 0) - (a.totalSales ?? 0))
      .slice(0, 5)
      .map((c) => ({
        name: c.customerName ?? "Cliente",
        revenue: toMajorRevenue(c.totalSales),
      }))

    const countries = [...countryPurchases]
      .map((c) => ({
        name: c.countryName ?? "Desconhecido",
        sales: parseCountrySales(c.totalSales),
      }))
      .filter((c) => c.sales > 0)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 8)

    return {
      ok: true,
      data: {
        period: {
          from: period.from,
          to: period.to,
          label: periodLabel(period),
        },
        kpis: {
          revenue: { current: revenueCurrent, previous: revenuePrevious },
          orders: { current: ordersCurrent, previous: ordersPrevious },
          customers: { current: customersCurrent, previous: customersPrevious },
          aov: { current: aovCurrent, previous: aovPrevious },
        },
        chartData: chart.data,
        chartGranularity: chart.granularity,
        topProducts,
        topCustomers,
        countries,
        paymentStatus: paymentStatus.map((s) => ({
          code: s.status?.code ?? "UNKNOWN",
          label: s.status?.description ?? s.status?.code ?? "—",
          quantity: s.quantity ?? 0,
        })),
        recentPayments: recentPayments.map((p) => ({
          id: p.paymentId,
          customerName: p.customer?.name || p.customer?.email || "—",
          amount: paymentTotalAmount(p),
          currency: p.currency ?? "CVE",
          date: p.paymentDate,
          reference: p.merchantReference,
        })),
      },
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao carregar analytics"
    return { ok: false, error: message }
  }
}
