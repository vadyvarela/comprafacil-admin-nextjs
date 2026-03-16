import "server-only"
import { runGraphQL } from "./graphql"
import { CHECKOUT_SESSION_SEARCH, CHECKOUT_SESSION_DETAILS } from "@/lib/graphql/orders/queries"
import type {
  CheckoutSessionResponse,
  CheckoutSessionDetailsResponse,
  CheckoutSessionPageResponse,
  OrderSummary,
} from "@/lib/graphql/orders/types"
import {
  getOrderStatusLabel,
  getOrderStatusVariant,
} from "@/lib/orders/status"
import type { OrdersTab } from "@/lib/orders/types"

/** Status da checkout session no gateway: COMPLETED = pagamento com sucesso. */
const STATUS_SUCCESS = "COMPLETED"

export const ORDER_PAGE_SIZE = 20

export type { OrdersTab } from "@/lib/orders/types"

export interface OrdersPageParams {
  search?: string | null
  page?: number
  tab?: OrdersTab
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

  const result = await runGraphQL<{ checkoutSessionSearch: CheckoutSessionPageResponse }>(
    CHECKOUT_SESSION_SEARCH,
    {
      filter: {
        // Lista apenas pedidos com pagamento bem-sucedido; filtro de fulfillment é feito depois.
        status: STATUS_SUCCESS,
        search: search ?? null,
      },
      page: {
        page,
        size: ORDER_PAGE_SIZE,
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

export { getOrderStatusLabel, getOrderStatusVariant } from "@/lib/orders/status"
export type { OrderSummary } from "@/lib/graphql/orders/types"

/**
 * Calcula total e resumo de produtos a partir dos detalhes.
 */
export function enrichOrderWithDetails(
  order: CheckoutSessionResponse,
  details: CheckoutSessionDetailsResponse | null
): OrderSummary {
  if (!details?.lines?.length) {
    return {
      ...order,
      totalAmount: null,
      productSummary: null,
      itemsCount: 0,
      fulfillmentStatus: details?.fulfillmentStatus ?? null,
    } as OrderSummary & {
      fulfillmentStatus?: CheckoutSessionDetailsResponse["fulfillmentStatus"] | null
    }
  }
  const total = details.lines.reduce(
    (sum, line) => sum + (line.quantity ?? 0) * (Number(line.unitAmount) ?? 0),
    0
  )
  const names = details.lines
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
  const itemsCount = details.lines.reduce((s, l) => s + (l.quantity ?? 0), 0)
  return {
    ...order,
    totalAmount: total,
    currency: details.currency ?? order.currency,
    productSummary: productSummary ?? null,
    itemsCount,
    fulfillmentStatus: details.fulfillmentStatus ?? null,
  } as OrderSummary & {
    fulfillmentStatus?: CheckoutSessionDetailsResponse["fulfillmentStatus"] | null
  }
}

/**
 * Lista pedidos e enriquece cada um com detalhes (total + produtos) em paralelo.
 */
export async function getOrdersPageWithDetails(
  params: OrdersPageParams
): Promise<
  | { ok: true; data: { data: OrderSummary[]; totalElements: number; totalPages: number } }
  | { ok: false; error: string }
> {
  const pageResult = await getOrdersPage(params)
  if (!pageResult.ok) return { ok: false, error: pageResult.error }
  const orders = pageResult.data.data
  if (orders.length === 0) {
    return {
      ok: true,
      data: {
        data: [],
        totalElements: pageResult.data.totalElements ?? 0,
        totalPages: pageResult.data.totalPages ?? 0,
      },
    }
  }
  const detailsResults = await Promise.all(
    orders.map((o) => getOrderById(o.id))
  )
  const enriched = orders.map((order, i) => {
    const det = detailsResults[i]
    const details = det?.ok ? det.data : null
    return enrichOrderWithDetails(order, details) as OrderSummary & {
      fulfillmentStatus?: CheckoutSessionDetailsResponse["fulfillmentStatus"] | null
    }
  })

  const tab = parseOrdersTab(params.tab)
  const data: OrderSummary[] =
    tab === "all"
      ? enriched
      : enriched.filter(
          (o) => o.fulfillmentStatus?.code?.toUpperCase() === tab
        )
  return {
    ok: true,
    data: {
      data,
      totalElements: pageResult.data.totalElements ?? 0,
      totalPages: pageResult.data.totalPages ?? 0,
    },
  }
}
