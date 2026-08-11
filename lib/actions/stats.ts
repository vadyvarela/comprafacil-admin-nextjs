import "server-only"
import { runGraphQL } from "./graphql"
import { DASHBOARD_STATS } from "@/lib/graphql/stats/queries"
import { fetchPaidRevenueSummary } from "@/lib/analytics/paid-revenue"

export interface SalesReport {
  totalRevenue: number
  totalProductSold: number
}

export interface PaymentStatusSummary {
  status: { code: string; description: string }
  quantity: number
}

export interface DashboardStatsResult {
  ok: true
  data: {
    salesSummary: SalesReport | null
    paymentStatusSummary: PaymentStatusSummary[]
  }
}

export type DashboardStatsOutput = DashboardStatsResult | { ok: false; error: string }

export interface StatsFilter {
  days?: number
  startDate?: string | null
  endDate?: string | null
}

export async function getDashboardStats(filter?: StatsFilter): Promise<DashboardStatsOutput> {
  const [result, paidRevenue] = await Promise.all([
    runGraphQL<{
      salesSummary: SalesReport | null
      paymentStatusSummary: PaymentStatusSummary[]
    }>(DASHBOARD_STATS, {
      filter: filter
        ? {
            days: filter.days ?? null,
            startDate: filter.startDate ?? null,
            endDate: filter.endDate ?? null,
          }
        : null,
    }),
    fetchPaidRevenueSummary({
      days: filter?.days ?? null,
      startDate: filter?.startDate ?? null,
      endDate: filter?.endDate ?? null,
    }),
  ])

  if (result.errors?.length) {
    return { ok: false, error: result.errors.map((e) => e.message).join("; ") }
  }

  const baseSummary = result.data?.salesSummary
  const salesSummary: SalesReport = {
    totalRevenue:
      paidRevenue?.totalRevenueMinor ?? baseSummary?.totalRevenue ?? 0,
    totalProductSold:
      paidRevenue?.orderCount ?? baseSummary?.totalProductSold ?? 0,
  }

  return {
    ok: true,
    data: {
      salesSummary,
      paymentStatusSummary: result.data?.paymentStatusSummary ?? [],
    },
  }
}
