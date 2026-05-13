"use server"

import { homeLayoutDocumentSchema } from "@/lib/home-layout/schema"

function stripEnvQuotes(value: string): string {
  const t = value.trim()
  if (t.length >= 2) {
    if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
      return t.slice(1, -1).trim()
    }
  }
  return t
}

/** Origem da loja (techarena) para iframe de preview. */
function resolveTecharenaOrigin(): string | null {
  const publicUrl = process.env.NEXT_PUBLIC_TECHARENA_URL?.trim()
  if (publicUrl) {
    try {
      const u = new URL(/^https?:\/\//i.test(publicUrl) ? stripEnvQuotes(publicUrl) : `http://${stripEnvQuotes(publicUrl)}`)
      return u.origin
    } catch {
      /* fallthrough */
    }
  }

  const raw = process.env.TECHARENA_REVALIDATE_URL?.trim()
  if (!raw) return null
  const cleaned = stripEnvQuotes(raw)
  try {
    const u = new URL(/^https?:\/\//i.test(cleaned) ? cleaned : `http://${cleaned}`)
    return u.origin
  } catch {
    return null
  }
}

function previewSecret(): string {
  const primary = process.env.TECHARENA_HOME_PREVIEW_SECRET
  if (primary != null && stripEnvQuotes(primary)) return stripEnvQuotes(primary)
  const fallback = process.env.TECHARENA_REVALIDATE_SECRET
  return fallback != null ? stripEnvQuotes(fallback) : ""
}

export type BuildHomePreviewUrlResult =
  | { ok: true; url: string }
  | { ok: false; message: string }

/**
 * Cria sessão de preview na techarena (POST) e devolve URL curta `/home-preview?s=…`.
 * Autenticação: header `x-home-preview-secret` = `TECHARENA_HOME_PREVIEW_SECRET` ou, em alternativa, `TECHARENA_REVALIDATE_SECRET`.
 */
export async function buildHomePreviewUrl(payload: unknown): Promise<BuildHomePreviewUrlResult> {
  const parsed = homeLayoutDocumentSchema.safeParse(payload)
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues.map((e) => e.message).join(" · "),
    }
  }

  const origin = resolveTecharenaOrigin()
  if (!origin) {
    return {
      ok: false,
      message:
        "Define NEXT_PUBLIC_TECHARENA_URL (ex. http://127.0.0.1:3001) ou TECHARENA_REVALIDATE_URL com o host da loja.",
    }
  }

  const secret = previewSecret()
  if (!secret) {
    return {
      ok: false,
      message:
        "Define TECHARENA_HOME_PREVIEW_SECRET ou TECHARENA_REVALIDATE_SECRET no backoffice (igual ao da techarena).",
    }
  }

  const sessionUrl = `${origin}/api/home-preview/session`
  let res: Response
  try {
    res = await fetch(sessionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-home-preview-secret": secret,
      },
      body: JSON.stringify({ layout: parsed.data }),
      cache: "no-store",
    })
  } catch {
    return {
      ok: false,
      message: "Não foi possível contactar a loja para criar o preview. Confirma que a techarena está a correr e o URL está correto.",
    }
  }

  let body: unknown
  try {
    body = await res.json()
  } catch {
    return {
      ok: false,
      message: `Resposta inválida da loja (${res.status}).`,
    }
  }

  const id = typeof (body as { id?: unknown }).id === "string" ? (body as { id: string }).id : null
  if (!res.ok || !id) {
    const err =
      typeof (body as { error?: unknown }).error === "string"
        ? (body as { error: string }).error
        : `Erro ${res.status} ao criar sessão de preview.`
    return { ok: false, message: err }
  }

  return { ok: true, url: `${origin}/home-preview?s=${encodeURIComponent(id)}` }
}
