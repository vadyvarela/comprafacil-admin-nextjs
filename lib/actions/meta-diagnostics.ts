"use server"

import { canReadModule } from "@/lib/auth/roles"
import { requireStoreSessionOrThrow } from "@/lib/auth/requireRole"

export type MetaDiagnosticsLastEvent = {
  eventName: string
  createdAt: string
  page?: string | null
  productId?: string | null
  categoryId?: string | null
  orderId?: string | null
}

export type MetaCatalogHealthIssue = {
  type: string
  rowId?: string
  title?: string
  message: string
}

export type MetaCatalogHealthSummary = {
  totalRows: number
  validRows: number
  issueCount: number
  issues: MetaCatalogHealthIssue[]
  counts: Record<string, number>
}

export type MetaDiagnosticsPayload = {
  generatedAt: string
  commerce: {
    catalogFeedUrl: string
    catalogHealthUrl: string
    catalogHealth: MetaCatalogHealthSummary | null
    catalogHealthError: string | null
  }
  configuration: {
    pixelConfigured: boolean
    capiConfigured: boolean
    catalogAvailable: boolean
    testMode: boolean
  }
  catalog: {
    totalProducts: number
    totalVariants: number
    productsMissingImage: number
    productsMissingPrice: number
    productsMissingStock: number
    productsExcludedEstimate: number
    lastCheckedAt: string
  }
  tracking: {
    lastEvents: Record<string, MetaDiagnosticsLastEvent | null>
    lastCapiError: {
      type: string
      message: string
      eventName?: string | null
      orderId?: string | null
      status?: string | null
      createdAt: string
    } | null
  }
}

export type MetaDiagnosticsResult =
  | { ok: true; data: MetaDiagnosticsPayload }
  | { ok: false; message: string }

function resolveStoreOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_TECHARENA_URL?.trim() ||
    process.env.NEXT_PUBLIC_STORE_URL?.trim() ||
    "https://kumprafacil.cv"
  ).replace(/\/$/, "")
}

function isCatalogHealthSummary(value: unknown): value is MetaCatalogHealthSummary {
  if (!value || typeof value !== "object") return false
  const row = value as Partial<MetaCatalogHealthSummary>
  return (
    typeof row.totalRows === "number" &&
    typeof row.validRows === "number" &&
    typeof row.issueCount === "number" &&
    Array.isArray(row.issues) &&
    !!row.counts &&
    typeof row.counts === "object"
  )
}

async function fetchCatalogHealth(
  catalogHealthUrl: string,
): Promise<Pick<MetaDiagnosticsPayload["commerce"], "catalogHealth" | "catalogHealthError">> {
  try {
    const res = await fetch(catalogHealthUrl, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) {
      return {
        catalogHealth: null,
        catalogHealthError: `Erro do feed (${res.status})`,
      }
    }

    const json = (await res.json()) as unknown
    if (!isCatalogHealthSummary(json)) {
      return {
        catalogHealth: null,
        catalogHealthError: "Resposta de health inválida.",
      }
    }

    return { catalogHealth: json, catalogHealthError: null }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao validar feed do catálogo."
    return { catalogHealth: null, catalogHealthError: message }
  }
}

/**
 * GET /api/marketing-analytics/meta-diagnostics no gateway.
 */
export async function fetchMetaDiagnostics(): Promise<MetaDiagnosticsResult> {
  try {
    const session = await requireStoreSessionOrThrow()
    if (!canReadModule(session.user, "settings")) {
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

  const storeOrigin = resolveStoreOrigin()
  const catalogFeedUrl = `${storeOrigin}/api/meta/catalog`
  const catalogHealthUrl = `${storeOrigin}/api/meta/catalog/health`
  const url = `${base.replace(/\/$/, "")}/api/marketing-analytics/meta-diagnostics`

  try {
    const [res, catalogHealth] = await Promise.all([
      fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      }),
      fetchCatalogHealth(catalogHealthUrl),
    ])

    if (!res.ok) {
      const text = await res.text()
      return {
        ok: false,
        message: `Erro do gateway (${res.status}): ${text || res.statusText}`,
      }
    }

    const json = (await res.json()) as {
      data?: MetaDiagnosticsPayload
      status?: boolean
    }

    if (!json?.data) {
      return { ok: false, message: "Resposta de diagnóstico inválida." }
    }

    return {
      ok: true,
      data: {
        ...json.data,
        commerce: {
          catalogFeedUrl,
          catalogHealthUrl,
          ...catalogHealth,
        },
      },
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao obter diagnóstico Meta."
    return { ok: false, message }
  }
}
