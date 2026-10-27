import "server-only"
import { ApiError, apiFetch } from "@/lib/api/client"
import { requirePermissionOrThrow } from "@/lib/auth/requirePermission"
import type { AnalyticsPeriod } from "@/lib/analytics/period"

export type FunnelStepName =
  | "page_view"
  | "product_view"
  | "add_to_cart"
  | "begin_checkout"
  | "purchase"

export type FunnelData = {
  from: string
  to: string
  steps: Array<{ eventName: FunnelStepName; sessions: number }>
  payments: Array<{ status: string; total: number }>
  sources: Array<{
    source: string
    sessions: number
    carts: number
    checkouts: number
    purchases: number
  }>
}

export type FunnelResult =
  | { ok: true; data: FunnelData }
  | { ok: false; message: string }

/**
 * GET /api/marketing-analytics/funnel no gateway.
 *
 * Vai com o token de quem está autenticado e no âmbito da loja activa: é a API
 * que confirma a permissão e decide de que loja são os dados.
 */
export async function fetchFunnel(period: AnalyticsPeriod): Promise<FunnelResult> {
  let storeId: string
  try {
    storeId = (await requirePermissionOrThrow("platform.events.read")).activeStoreId
  } catch (err) {
    const denied = err instanceof Error && err.message === "Insufficient permissions"
    return {
      ok: false,
      message: denied ? "Sem permissão." : "Autenticação admin necessária.",
    }
  }

  const params = new URLSearchParams({
    from: period.from.toISOString(),
    to: period.to.toISOString(),
  })

  try {
    const data = await apiFetch<FunnelData>(`/api/marketing-analytics/funnel?${params}`, {
      method: "GET",
      storeId,
      signal: AbortSignal.timeout(15000),
    })
    if (!data?.steps) {
      return { ok: false, message: "Resposta do funil inválida." }
    }
    return { ok: true, data }
  } catch (err) {
    if (err instanceof ApiError) {
      return { ok: false, message: `Erro do gateway (${err.status}): ${err.message}` }
    }
    const message = err instanceof Error ? err.message : "Erro ao obter o funil."
    return { ok: false, message }
  }
}
