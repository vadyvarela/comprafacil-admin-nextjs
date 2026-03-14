"use server"

import { runGraphQL } from "./graphql"
import { UPDATE_ORDER_FULFILLMENT_STATUS } from "@/lib/graphql/orders/mutations"
import type { CheckoutSessionDetailsResponse } from "@/lib/graphql/orders/types"

export type UpdateOrderFulfillmentResult =
  | { ok: true; data: CheckoutSessionDetailsResponse }
  | { ok: false; error: string }

export async function updateOrderFulfillmentStatus(
  checkoutSessionId: string,
  fulfillmentStatus: string
): Promise<UpdateOrderFulfillmentResult> {
  const result = await runGraphQL<{
    updateOrderFulfillmentStatus: CheckoutSessionDetailsResponse
  }>(UPDATE_ORDER_FULFILLMENT_STATUS, {
    checkoutSessionId,
    fulfillmentStatus,
  })

  if (result.errors?.length) {
    return { ok: false, error: result.errors.map((e) => e.message).join("; ") }
  }

  const data = result.data?.updateOrderFulfillmentStatus
  if (!data) {
    return { ok: false, error: "Resposta inválida do servidor." }
  }

  return { ok: true, data }
}
