import "server-only"
import { can, getPrincipal } from "@/lib/auth/principal"
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
 */
export async function fetchFunnel(period: AnalyticsPeriod): Promise<FunnelResult> {
  try {
    if (!can(await getPrincipal(), "marketing.analytics.read")) {
      throw new Error("Insufficient permissions")
    }
  } catch {
    return { ok: false, message: "Autenticação admin necessária." }
  }

  const base = process.env.GTW_URL
  const token = process.env.CMS_ACCESS_TOKEN
  if (!base || !token) {
    return { ok: false, message: "Gateway não configurado." }
  }

  const params = new URLSearchParams({
    from: period.from.toISOString(),
    to: period.to.toISOString(),
  })
  const url = `${base.replace(/\/$/, "")}/api/marketing-analytics/funnel?${params}`

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
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

    const json = (await res.json()) as { data?: FunnelData }
    if (!json?.data?.steps) {
      return { ok: false, message: "Resposta do funil inválida." }
    }
    return { ok: true, data: json.data }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao obter o funil."
    return { ok: false, message }
  }
}
