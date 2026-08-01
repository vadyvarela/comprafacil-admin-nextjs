"use server"

import { requireModuleWriteOrThrow } from "@/lib/auth/requireRole"

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
    await requireModuleWriteOrThrow("transactions")
  } catch {
    return { ok: false, message: "Autenticação admin necessária." }
  }

  const base = process.env.GTW_URL
  const token = process.env.CMS_ACCESS_TOKEN
  if (!base || !token) {
    return { ok: false, message: "Gateway não configurado." }
  }

  const url = `${base.replace(/\/$/, "")}/api/payment/purchaseReconciliation`

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        referenceId: payload.referenceId,
        status: payload.status,
        statusReason: payload.statusReason ?? "",
        cardType: payload.cardType ?? "",
        card: payload.card ?? "",
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
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
