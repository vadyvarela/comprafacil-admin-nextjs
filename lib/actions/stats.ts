import "server-only"
import { runGraphQL } from "./graphql"
import { DASHBOARD_STATS } from "@/lib/graphql/stats/queries"

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
  const result = await runGraphQL<{
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
  })

  if (result.errors?.length) {
    return { ok: false, error: result.errors.map((e) => e.message).join("; ") }
  }

  return {
    ok: true,
    data: {
      salesSummary: result.data?.salesSummary ?? null,
      paymentStatusSummary: result.data?.paymentStatusSummary ?? [],
    },
  }
}
