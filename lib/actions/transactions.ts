import "server-only"
import { runGraphQL } from "./graphql"
import { PAYMENTS_SEARCH } from "@/lib/graphql/transactions/queries"
import type {
  PaymentsSearchResponse,
  PaymentsPage,
  PaymentPageRequest,
  PaymentFilterRequest,
} from "@/lib/graphql/transactions/types"

export interface GetTransactionsParams {
  page?: PaymentPageRequest
  filter?: PaymentFilterRequest
}

const DEFAULT_PAGE: PaymentPageRequest = {
  page: 0,
  size: 20,
  sortBy: "createdAt",
  sortDirection: "DESC",
}

const DEFAULT_FILTER: PaymentFilterRequest = {
  customerId: null,
  status: null,
  merchantReference: null,
  amount: null,
  authorizedAt: null,
  search: null,
}

export type GetTransactionsResult =
  | { ok: true; data: PaymentsPage }
  | { ok: false; error: string }

/**
 * Obtém todas as transações (payment intents) via paymentsSearch do gateway.
 * Mesmo contrato do zing-payment-gateway-dashboard-ui-nextjs.
 */
export async function getTransactions(
  params: GetTransactionsParams = {}
): Promise<GetTransactionsResult> {
  const page = { ...DEFAULT_PAGE, ...params.page }
  const filter = { ...DEFAULT_FILTER, ...params.filter }

  const result = await runGraphQL<PaymentsSearchResponse>(PAYMENTS_SEARCH, {
    page: {
      page: page.page ?? 0,
      size: page.size ?? 20,
      sortBy: page.sortBy ?? "createdAt",
      sortDirection: page.sortDirection ?? "DESC",
    },
    filter: {
      customerId: filter.customerId ?? null,
      status: filter.status ?? null,
      merchantReference: filter.merchantReference ?? null,
      search: filter.search ?? null,
      amount: filter.amount ?? null,
      authorizedAt: filter.authorizedAt ?? null,
    },
  })

  if (result.errors?.length) {
    const msg = result.errors.map((e) => e.message).join("; ")
    return { ok: false, error: msg }
  }

  const node = result.data?.paymentsSearch
  if (!node) {
    return {
      ok: true,
      data: {
        data: [],
        pageNumber: page.page ?? 0,
        pageSize: page.size ?? 20,
        totalElements: 0,
        totalPages: 0,
      },
    }
  }

  const data: PaymentsPage = {
    data: Array.isArray(node.data) ? node.data : [],
    pageNumber: node.pageNumber ?? 0,
    pageSize: node.pageSize ?? 0,
    totalElements: node.totalElements ?? 0,
    totalPages: node.totalPages ?? 0,
  }

  return { ok: true, data }
}
