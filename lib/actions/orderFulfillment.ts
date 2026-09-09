"use server"

import { runGraphQL } from "./graphql"
import { UPDATE_ORDER_FULFILLMENT_STATUS } from "@/lib/graphql/orders/mutations"
import type { CheckoutSessionDetailsResponse } from "@/lib/graphql/orders/types"
import { requirePermissionOrThrow } from "@/lib/auth/requirePermission"

export type UpdateOrderFulfillmentResult =
  | { ok: true; data: CheckoutSessionDetailsResponse }
  | { ok: false; error: string }

export async function updateOrderFulfillmentStatus(
  checkoutSessionId: string,
  fulfillmentStatus: string
): Promise<UpdateOrderFulfillmentResult> {
  let session
  try {
    session = await requirePermissionOrThrow("orders.write")
  } catch {
    return { ok: false, error: "Autenticação admin necessária." }
  }

  const user = session.user as {
    sub?: string | null
    email?: string | null
    name?: string | null
  }

  const result = await runGraphQL<{
    updateOrderFulfillmentStatus: CheckoutSessionDetailsResponse
  }>(UPDATE_ORDER_FULFILLMENT_STATUS, {
    checkoutSessionId,
    fulfillmentStatus,
    actor: {
      id: user.sub ?? null,
      email: user.email ?? null,
      name: user.name ?? null,
    },
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
