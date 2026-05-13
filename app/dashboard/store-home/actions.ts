"use server"

export type RevalidateTecharenaHomeResult =
  | { ok: true; skipped: true }
  | { ok: true }
  | { ok: false; status?: number; message: string }

function stripEnvQuotes(value: string): string {
  const t = value.trim()
  if (t.length >= 2) {
    if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
      return t.slice(1, -1).trim()
    }
  }
  return t
}

/** URL final POST `/api/revalidate` na techarena (path sempre `/api/revalidate`). */
function normalizeRevalidateUrl(raw: string): string {
  const trimmed = raw.trim()
  const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`
  try {
    const u = new URL(withProto)
    u.pathname = "/api/revalidate"
    u.search = ""
    u.hash = ""
    return u.toString().replace(/\/+$/, "")
  } catch {
    const base = trimmed.replace(/\/+$/, "")
    return `${base}/api/revalidate`
  }
}

/**
 * Invalida cache da home na loja (Next), se env estiver configurado.
 * O server action corre no host do backoffice: em Docker, `localhost` é o próprio container —
 * usa o hostname/IP onde a techarena está acessível a partir do backoffice.
 */
export async function revalidateTecharenaHome(): Promise<RevalidateTecharenaHomeResult> {
  const rawUrl = process.env.TECHARENA_REVALIDATE_URL?.trim()
  const rawSecret = process.env.TECHARENA_REVALIDATE_SECRET
  const secret = rawSecret != null ? stripEnvQuotes(rawSecret) : ""

  if (!rawUrl || !secret) {
    return { ok: true, skipped: true }
  }

  const url = normalizeRevalidateUrl(rawUrl)

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "x-revalidate-secret": secret },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    })

    if (res.ok) {
      return { ok: true }
    }

    let detail = res.statusText || `HTTP ${res.status}`
    try {
      const body = (await res.json()) as { ok?: boolean; error?: string }
      if (body && typeof body === "object" && body.error) {
        detail = `${detail}: ${body.error}`
      }
    } catch {
      // ignore
    }

    if (res.status === 401) {
      return {
        ok: false,
        status: 401,
        message: `401 — secret não coincide com TECHARENA_REVALIDATE_SECRET na techarena (ou secret vazio lá). ${detail}`,
      }
    }

    if (res.status === 404) {
      return {
        ok: false,
        status: 404,
        message: `404 em ${url} — esta app não tem POST /api/revalidate. Usa o host da techarena (ex. http://127.0.0.1:3001), não o do backoffice.`,
      }
    }

    return {
      ok: false,
      status: res.status,
      message: `${res.status} ${detail}`,
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return {
      ok: false,
      message: `Rede: ${msg}. Confirma URL (ex. http://127.0.0.1:3001/api/revalidate se backoffice não vê «localhost»).`,
    }
  }
}
