"use server"

import { requireAdminSessionOrThrow } from "@/lib/auth/requireAdmin"

/**
 * Payload para o endpoint purchaseReconciliation do payment-gateway.
 * Alinhado a PurchaseReconciliationRequest e PurchaseReconciliationStatusEnum (Completed | Error).
 */
export type PurchaseReconciliationPayload = {
  referenceId: string
  status: "Completed" | "Error"
  statusReason?: string
  cardType?: string
  card?: string
}

export type PurchaseReconciliationResult =
  | { ok: true }
  | { ok: false; message: string }

/**
 * Chama POST /api/payment/purchaseReconciliation no gateway.
 * Usa GTW_URL como base (mesmo que o GraphQL).
 */
export async function purchaseReconciliation(
  payload: PurchaseReconciliationPayload
): Promise<PurchaseReconciliationResult> {
  try {
    await requireAdminSessionOrThrow()
  } catch {
    return { ok: false, message: "Autenticação admin necessária." }
  }

  const base = process.env.GTW_URL
  if (!base) {
    return { ok: false, message: "GTW_URL não configurado." }
  }

  const url = `${base.replace(/\/$/, "")}/api/payment/purchaseReconciliation`

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        referenceId: payload.referenceId,
        status: payload.status,
        statusReason: payload.statusReason ?? "",
        cardType: payload.cardType ?? "",
        card: payload.card ?? "",
      }),
      cache: "no-store",
    })

    if (!res.ok) {
      const text = await res.text()
      return {
        ok: false,
        message: `Erro do gateway (${res.status}): ${text || res.statusText}`,
      }
    }

    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao chamar o gateway."
    return { ok: false, message }
  }
}
