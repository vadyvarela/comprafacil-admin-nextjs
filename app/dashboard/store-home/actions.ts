"use server"

/**
 * Invalida cache da home na loja (Next), se env estiver configurado.
 */
export async function revalidateTecharenaHome(): Promise<{ ok: boolean; skipped?: boolean }> {
  const url = process.env.TECHARENA_REVALIDATE_URL?.trim()
  const secret = process.env.TECHARENA_REVALIDATE_SECRET?.trim()
  if (!url || !secret) {
    return { ok: true, skipped: true }
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "x-revalidate-secret": secret },
      signal: AbortSignal.timeout(15000),
    })
    return { ok: res.ok }
  } catch {
    return { ok: false }
  }
}
