import {
  getCachedDetail,
  getCachedSearch,
  setCachedDetail,
  setCachedSearch,
} from "./cache"
import type {
  MobileApiDeviceDetail,
  MobileApiSearchResponse,
  SpecsDetailResponse,
  SpecsSearchResult,
} from "./types"
import { mapMobileApiToSpecifications } from "./map-mobileapi-to-specifications"

const BASE_URL = "https://api.mobileapi.dev"
const TIMEOUT_MS = 15_000

export class MobileApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message)
    this.name = "MobileApiError"
  }
}

function getApiKey(): string {
  const key = process.env.MOBILEAPI_KEY?.trim()
  if (!key) {
    throw new MobileApiError("API key em falta. Configure MOBILEAPI_KEY no ambiente.", 503)
  }
  return key
}

async function mobileApiFetch<T>(path: string): Promise<T> {
  const key = getApiKey()
  const url = `${BASE_URL}${path}${path.includes("?") ? "&" : "?"}key=${encodeURIComponent(key)}`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Token ${key}`,
      },
      signal: controller.signal,
      cache: "no-store",
    })

    if (res.status === 401) {
      throw new MobileApiError("API key inválida. Verifique MOBILEAPI_KEY.", 401)
    }
    if (res.status === 429) {
      throw new MobileApiError("Limite de pedidos atingido. Tente novamente mais tarde.", 429)
    }
    if (res.status === 204) {
      throw new MobileApiError("Dispositivo não encontrado.", 404)
    }
    if (!res.ok) {
      let detail = res.statusText
      try {
        const body = (await res.json()) as { detail?: string; error?: string }
        detail = body.detail || body.error || detail
      } catch {
        /* ignore */
      }
      if (res.status === 400 && /credit/i.test(detail)) {
        throw new MobileApiError("Limite mensal de créditos atingido.", 429)
      }
      throw new MobileApiError(detail || "Erro ao consultar MobileAPI.", res.status)
    }

    return (await res.json()) as T
  } catch (err) {
    if (err instanceof MobileApiError) throw err
    if (err instanceof Error && err.name === "AbortError") {
      throw new MobileApiError("Tempo esgotado ao consultar MobileAPI.", 504)
    }
    throw new MobileApiError(
      err instanceof Error ? err.message : "Erro ao consultar MobileAPI.",
      502
    )
  } finally {
    clearTimeout(timer)
  }
}

function brandName(device: MobileApiDeviceDetail): string {
  return device.manufacturer_name?.trim() || device.brand?.name?.trim() || ""
}

export async function searchMobileDevices(
  query: string,
  manufacturer?: string
): Promise<SpecsSearchResult[]> {
  const q = query.trim()
  if (!q) return []

  const cacheKey = `${q.toLowerCase()}|${(manufacturer || "").toLowerCase()}`
  const cached = getCachedSearch<SpecsSearchResult[]>(cacheKey)
  if (cached) return cached

  const params = new URLSearchParams({ name: q, page: "1" })
  if (manufacturer?.trim()) params.set("manufacturer", manufacturer.trim())

  const data = await mobileApiFetch<MobileApiSearchResponse>(`/devices/search/?${params}`)
  const devices = data.devices ?? []

  const results: SpecsSearchResult[] = devices
    .filter((d) => typeof d.id === "number")
    .slice(0, 20)
    .map((d) => ({
      id: d.id,
      name: d.name?.trim() || `Dispositivo #${d.id}`,
      brand: brandName(d),
      releaseDate: d.release_date?.trim(),
      matchCertainty: d.match_certainty?.trim(),
    }))

  setCachedSearch(cacheKey, results)
  return results
}

export async function getMobileDeviceSpecifications(
  deviceId: number
): Promise<SpecsDetailResponse> {
  if (!Number.isFinite(deviceId) || deviceId <= 0) {
    throw new MobileApiError("ID de dispositivo inválido.", 400)
  }

  const cached = getCachedDetail<SpecsDetailResponse>(deviceId)
  if (cached) return cached

  const device = await mobileApiFetch<MobileApiDeviceDetail>(`/devices/${deviceId}/`)
  const specifications = mapMobileApiToSpecifications(device)

  if (Object.keys(specifications).length === 0) {
    throw new MobileApiError("Não foi possível extrair especificações deste dispositivo.", 404)
  }

  const result: SpecsDetailResponse = {
    deviceId,
    deviceName: device.name?.trim() || `Dispositivo #${deviceId}`,
    specifications,
  }

  setCachedDetail(deviceId, result)
  return result
}
