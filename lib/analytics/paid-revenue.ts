import "server-only"
import { endOfDay, startOfDay, subDays } from "date-fns"
import { getTransactions } from "@/lib/actions/transactions"
import { toGraphQLDateTime, toGraphQLDateTimeBoundary } from "@/lib/utils/graphql-datetime"

/** PaymentIntentStatusEnum.PAYMENT_SUCCEEDED */
const SUCCESS_STATUS = "PS"
const MAX_PAGES = 20
const PAGE_SIZE = 200

export type PaidRevenueSummary = {
  /** Soma de `payment_intent.amount` (unidades menores, inclui entrega). */
  totalRevenueMinor: number
  orderCount: number
}

type PaidRevenueRange = {
  days?: number | null
  startDate?: string | null
  endDate?: string | null
}

function resolvePaidRevenueRange(params: PaidRevenueRange): {
  dateFrom: string | null
  dateTo: string | null
} {
  if (params.startDate || params.endDate) {
    return {
      dateFrom: toGraphQLDateTimeBoundary(params.startDate, "start"),
      dateTo: toGraphQLDateTimeBoundary(params.endDate, "end"),
    }
  }

  if (params.days != null && params.days > 0) {
    const end = endOfDay(new Date())
    const start = startOfDay(subDays(end, params.days))
    return {
      dateFrom: toGraphQLDateTime(start),
      dateTo: toGraphQLDateTime(end),
    }
  }

  return { dateFrom: null, dateTo: null }
}

/**
 * Receita real = valor cobrado nos payment intents com sucesso (produtos − desconto + entrega).
 * Alinha KPIs do dashboard/analytics com pedidos recentes e gráfico de receita.
 */
export async function fetchPaidRevenueSummary(
  params: PaidRevenueRange
): Promise<PaidRevenueSummary | null> {
  const { dateFrom, dateTo } = resolvePaidRevenueRange(params)

  let totalRevenueMinor = 0
  const seenIds = new Set<string>()
  let page = 0
  let totalPages = 1

  while (page < totalPages && page < MAX_PAGES) {
    const res = await getTransactions({
      page: {
        page,
        size: PAGE_SIZE,
        sortBy: "createdAt",
        sortDirection: "ASC",
      },
      filter: {
        status: SUCCESS_STATUS,
        dateFrom,
        dateTo,
      },
    })

    if (!res.ok) return null

    for (const tx of res.data.data) {
      if (!tx.id || seenIds.has(tx.id)) continue
      seenIds.add(tx.id)
      const amount = Number(tx.amount)
      if (!Number.isFinite(amount) || amount <= 0) continue
      totalRevenueMinor += amount
    }

    totalPages = res.data.totalPages ?? 1
    page++
  }

  return {
    totalRevenueMinor,
    orderCount: seenIds.size,
  }
}
