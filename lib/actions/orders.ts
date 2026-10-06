import "server-only"
import { runGraphQL } from "./graphql"
import { CHECKOUT_SESSION_SEARCH, CHECKOUT_SESSION_DETAILS } from "@/lib/graphql/orders/queries"
import type {
  CheckoutSessionResponse,
  CheckoutSessionDetailsResponse,
  CheckoutSessionPageResponse,
  OrderSummary,
} from "@/lib/graphql/orders/types"
import { minorToMajorCurrencyAmount } from "@/lib/utils/currency"
import { computeCheckoutPricing } from "@/lib/utils/checkout-total"
import type { OrdersTab } from "@/lib/orders/types"
import { toGraphQLDateTimeBoundary } from "@/lib/utils/graphql-datetime"

/** Status da checkout session no gateway: COMPLETED = pagamento com sucesso. */
const STATUS_SUCCESS = "COMPLETED"

export const ORDER_PAGE_SIZE = 100

export type { OrdersTab } from "@/lib/orders/types"

export interface OrdersPageParams {
  search?: string | null
  page?: number
  /** Omitir usa ORDER_PAGE_SIZE. */
  size?: number
  tab?: OrdersTab
  dateFrom?: string | null
  dateTo?: string | null
}

export interface OrdersPageResult {
  ok: true
  data: {
    data: CheckoutSessionResponse[]
    totalElements?: number
    totalPages?: number
  }
}

export interface OrderByIdResult {
  ok: true
  data: CheckoutSessionDetailsResponse
}

export type OrdersPageOutput =
  | OrdersPageResult
  | { ok: false; error: string }

export type OrderByIdOutput =
  | OrderByIdResult
  | { ok: false; error: string; notFound?: boolean }

export function parseOrdersTab(value?: string | null): OrdersTab {
  const v = (value ?? "").toUpperCase()
  if (v === "PENDING" || v === "PREPARING" || v === "SHIPPED" || v === "DELIVERED" || v === "CANCELLED") {
    return v as OrdersTab
  }
  return "all"
}

/**
 * Lista apenas pedidos com sucesso (status COMPLETED).
 * Filtro por payment intent / checkout session: só sucesso.
 */
export async function getOrdersPage(params: OrdersPageParams): Promise<OrdersPageOutput> {
  const search = params.search?.trim() ?? null
  const page = Math.max(0, params.page ?? 0)
  const tab = parseOrdersTab(params.tab)

  const result = await runGraphQL<{ checkoutSessionSearch: CheckoutSessionPageResponse }>(
    CHECKOUT_SESSION_SEARCH,
    {
      filter: {
        status: STATUS_SUCCESS,
        search: search ?? null,
        dateFrom: toGraphQLDateTimeBoundary(params.dateFrom, "start"),
        dateTo: toGraphQLDateTimeBoundary(params.dateTo, "end"),
        fulfillmentStatus: tab === "all" ? null : tab,
      },
      page: {
        page,
        size: params.size ?? ORDER_PAGE_SIZE,
        sortBy: "createdAt",
        sortDirection: "DESC",
      },
    }
  )

  if (result.errors?.length) {
    return { ok: false, error: result.errors.map((e) => e.message).join("; ") }
  }

  const node = result.data?.checkoutSessionSearch
  if (!node) {
    return {
      ok: true,
      data: {
        data: [],
        totalElements: 0,
        totalPages: 0,
      },
    }
  }

  return {
    ok: true,
    data: {
      data: Array.isArray(node.data) ? node.data : [],
      totalElements: node.totalElements ?? 0,
      totalPages: node.totalPages ?? 0,
    },
  }
}

export async function getOrderById(id: string): Promise<OrderByIdOutput> {
  const result = await runGraphQL<{
    checkoutSessionDetails: CheckoutSessionDetailsResponse | null
  }>(CHECKOUT_SESSION_DETAILS, { id })

  if (result.errors?.length) {
    return { ok: false, error: result.errors.map((e) => e.message).join("; ") }
  }

  const order = result.data?.checkoutSessionDetails
  if (!order) {
    return { ok: false, error: "Pedido não encontrado", notFound: true }
  }

  return { ok: true, data: order }
}

export { getOrderStatusLabel } from "@/lib/orders/status"
export type { OrderSummary } from "@/lib/graphql/orders/types"

/**
 * Calcula total e resumo de produtos a partir das linhas que a pesquisa já traz.
 */
export function summarizeOrder(order: CheckoutSessionResponse): OrderSummary {
  const lines = order.lines ?? []
  if (lines.length === 0) {
    return {
      ...order,
      totalAmount: null,
      productSummary: null,
      primaryProductImageUrl: null,
      itemsCount: 0,
      orderLineCount: 0,
      fulfillmentStatus: order.fulfillmentStatus ?? null,
    }
  }
  const pricing = computeCheckoutPricing({
    lines: lines.map((line) => ({
      unitAmount: Number(line.unitAmount) || 0,
      quantity: line.quantity ?? 0,
    })),
    // A pesquisa devolve o desconto em escudos; o cálculo trabalha em cêntimos.
    amountDiscount:
      order.amountDiscount != null ? Math.round(order.amountDiscount * 100) : null,
    amountShipping: order.amountShipping,
  })
  const names = lines
    .map((l) =>
      l.productVariant?.product?.title ?? l.productVariant?.title ?? l.description ?? null
    )
    .filter(Boolean) as string[]
  const productSummary =
    names.length === 0
      ? null
      : names.length === 1
        ? names[0]
        : names.length <= 2
          ? names.join(", ")
          : `${names[0]} +${names.length - 1}`
  const itemsCount = lines.reduce((s, l) => s + (l.quantity ?? 0), 0)
  const orderLineCount = lines.length
  const firstLine = lines[0]
  const pv = firstLine?.productVariant
  const primaryProductImageUrl =
    (pv?.image?.trim() ? pv.image.trim() : null) ??
    (pv?.product?.image?.trim() ? pv.product.image.trim() : null) ??
    null
  return {
    ...order,
    totalAmount: minorToMajorCurrencyAmount(pricing.totalMinor),
    productSummary: productSummary ?? null,
    primaryProductImageUrl,
    itemsCount,
    orderLineCount,
    fulfillmentStatus: order.fulfillmentStatus ?? null,
  }
}

/**
 * Lista pedidos com total e resumo de produtos. O filtro por estado de envio
 * corre na API, por isso o total e a paginação batem certo com a aba.
 */
export async function getOrdersPageWithDetails(
  params: OrdersPageParams
): Promise<
  | { ok: true; data: { data: OrderSummary[]; totalElements: number; totalPages: number } }
  | { ok: false; error: string }
> {
  const pageResult = await getOrdersPage(params)
  if (!pageResult.ok) return { ok: false, error: pageResult.error }
  return {
    ok: true,
    data: {
      data: pageResult.data.data.map(summarizeOrder),
      totalElements: pageResult.data.totalElements ?? 0,
      totalPages: pageResult.data.totalPages ?? 0,
    },
  }
}
