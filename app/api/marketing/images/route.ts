import { NextResponse } from "next/server"
import { requireModuleWriteSession } from "@/lib/auth/requireRole"
import {
  attachMarketingCampaignAssets,
  getLiveMarketingCampaign,
  recordMarketingImage,
} from "@/lib/actions/marketing"
import { getStorefrontOrigin } from "@/lib/marketing/storefront"
import { validateImageBlob } from "@/lib/security/upload-validation"

export const maxDuration = 90

/**
 * GPT Image (gpt-image-2 / gpt-image-1.*): tamanhos oficiais.
 * Não usar 1024x1792 / 1792x1024 — esses são só DALL·E 3 (legado).
 * @see https://developers.openai.com/api/docs/guides/image-generation
 */
const FORMATS = {
  feed: { size: "1024x1024", label: "Feed" },
  stories: { size: "1024x1536", label: "Stories" },
  banner: { size: "1024x1024", label: "Banner" },
} as const

type FormatKey = keyof typeof FORMATS

const GPT_IMAGE_QUALITIES = new Set(["low", "medium", "high", "auto"])

function llmConfig() {
  const apiKey = process.env.MARKETING_AGENT_API_KEY?.trim()
  if (!apiKey) {
    return { error: "Falta MARKETING_AGENT_API_KEY no servidor do backoffice." }
  }
  const baseUrl = (
    process.env.MARKETING_AGENT_BASE_URL?.replace(/\/$/, "") || "https://api.openai.com/v1"
  ).trim()
  if (!baseUrl.includes("://")) {
    return { error: "MARKETING_AGENT_BASE_URL inválida (ex. https://api.openai.com/v1)." }
  }

  // Default actual: gpt-image-2 (abril 2026). Evitar dall-e-3.
  const imageModel = process.env.MARKETING_IMAGE_MODEL?.trim() || "gpt-image-2"
  const qualityRaw = process.env.MARKETING_IMAGE_QUALITY?.trim().toLowerCase() || "medium"
  const quality = GPT_IMAGE_QUALITIES.has(qualityRaw) ? qualityRaw : "medium"

  return { apiKey, imageModel, baseUrl, quality }
}

function isGptImageModel(model: string) {
  return model.startsWith("gpt-image") || model.startsWith("chatgpt-image")
}

async function readJsonBody<T>(
  res: Response,
): Promise<{ ok: true; data: T } | { ok: false; error: string; status: number }> {
  const raw = await res.text()
  const trimmed = raw.trim()
  if (!trimmed) {
    return { ok: false, status: res.status, error: `Resposta vazia da API de imagens (${res.status})` }
  }
  if (trimmed.startsWith("<!") || trimmed.startsWith("<html")) {
    return {
      ok: false,
      status: res.status,
      error:
        `A API de imagens devolveu HTML (${res.status}). ` +
        `Confirma MARKETING_AGENT_BASE_URL=https://api.openai.com/v1 e MARKETING_IMAGE_MODEL=gpt-image-2.`,
    }
  }
  try {
    return { ok: true, data: JSON.parse(trimmed) as T }
  } catch {
    return {
      ok: false,
      status: res.status,
      error: `Resposta inválida da API de imagens (${res.status}): ${trimmed.slice(0, 160)}`,
    }
  }
}

function openaiErrorMessage(data: unknown, status: number): string {
  const obj = data as {
    error?: { message?: string; code?: string; type?: string }
    message?: string
  } | null
  const msg =
    obj?.error?.message?.trim() ||
    (typeof obj?.message === "string" ? obj.message.trim() : "") ||
    ""
  const code = obj?.error?.code?.trim()
  if (msg && code) return `${msg} (${code})`
  if (msg) return msg
  if (status === 401) return "API key inválida para imagens."
  if (status === 403) {
    return "Sem permissão para GPT Image. Completa a Organization Verification na consola OpenAI."
  }
  if (status === 429) return "Limite da OpenAI atingido. Espera um minuto e tenta outra vez."
  return `Geração de imagem falhou (${status}).`
}

function mimeFromBytes(bytes: Uint8Array): string {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg"
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png"
  }
  if (bytes.length >= 12) {
    const riff = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3])
    const webp = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11])
    if (riff === "RIFF" && webp === "WEBP") return "image/webp"
  }
  return "image/png"
}

function blobFromBytes(bytes: Uint8Array) {
  const type = mimeFromBytes(bytes)
  const ext = type === "image/jpeg" ? "jpg" : type === "image/webp" ? "webp" : "png"
  return { blob: new Blob([Buffer.from(bytes)], { type }), ext, type }
}

function requireGtw() {
  const gtwUrl = process.env.GTW_URL
  const cmsAccessToken = process.env.CMS_ACCESS_TOKEN
  if (!gtwUrl || !cmsAccessToken) {
    return { error: "Falta GTW_URL ou CMS_ACCESS_TOKEN para guardar a imagem na biblioteca." }
  }
  return { gtwUrl, cmsAccessToken }
}

function buildImagePrompt(userPrompt: string, format: FormatKey, siteUrl: string | null) {
  if (format === "banner") {
    return [
      userPrompt,
      "E-commerce homepage hero: isolated product cutout only.",
      "Show the physical product, centered, 3/4 studio view, sharp commercial lighting.",
      "Fully transparent background with alpha. No floor, table, backdrop, shadow plate or rectangular canvas.",
      "NO text, NO typography, NO logos, NO watermarks, NO website URL, NO badges, NO infographic, NO poster, NO white card.",
      "Product must not touch the edges. Leave padding around it.",
    ].join(" ")
  }

  return [
    userPrompt,
    "Professional retail campaign visual for a Cape Verde electronics store.",
    "Brand colors must dominate: primary blue #2563EB, dark blue #1D4ED8, light blue #3B82F6, on white or slate backgrounds. Use these blues on banners, lighting, buttons and highlights. No unrelated neon palettes.",
    siteUrl
      ? `Always include a clean bottom footer strip with the store URL written exactly as "${siteUrl}", sharp high-contrast sans-serif, correctly spelled, no extra characters.`
      : "Always include a clean bottom footer strip with the store website URL, sharp and readable.",
    "Clean commercial photography composition. No fake brand logos. No extra watermarks besides the store URL footer.",
  ].join(" ")
}

function storefrontDisplayUrl() {
  const origin = getStorefrontOrigin()
  if (!origin) return null
  try {
    return new URL(origin).host.replace(/^www\./, "")
  } catch {
    return origin.replace(/^https?:\/\//, "").replace(/\/$/, "")
  }
}

function mediaUrlFromGateway(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null
  const root = payload as Record<string, unknown>
  const nested =
    root.data && typeof root.data === "object" ? (root.data as Record<string, unknown>) : null
  const candidates = [nested?.url, nested?.imageUrl, nested?.secureUrl, root.url, root.imageUrl, root.secureUrl]
  for (const value of candidates) {
    if (typeof value === "string" && /^https?:\/\//i.test(value.trim())) return value.trim()
  }
  return null
}

function gatewayErrorMessage(payload: unknown, status: number): string {
  if (!payload || typeof payload !== "object") return `Upload ${status}`
  const root = payload as Record<string, unknown>
  const nested =
    root.data && typeof root.data === "object" ? (root.data as Record<string, unknown>) : null
  const msg = [nested?.uiMessage, nested?.technicalMessage, root.error, nested?.error].find(
    (value) => typeof value === "string" && value.trim(),
  )
  return typeof msg === "string" ? msg : `Upload ${status}`
}

async function uploadToLibrary(file: Blob, filename: string) {
  const cfg = requireGtw()
  if ("error" in cfg) throw new Error(cfg.error)
  const outbound = new FormData()
  outbound.append("file", file, filename)
  outbound.append("group", "marketing")
  outbound.append("source", "marketing-agent")
  const response = await fetch(`${cfg.gtwUrl}/api/media`, {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.cmsAccessToken}` },
    body: outbound,
    signal: AbortSignal.timeout(120000),
  })
  const raw = await response.text()
  if (!raw.trim() || raw.trim().startsWith("<!") || raw.trim().startsWith("<html")) {
    throw new Error(
      `Upload para a biblioteca falhou (${response.status}). Confirma GTW_URL e CMS_ACCESS_TOKEN.`,
    )
  }
  let data: unknown = {}
  try {
    data = JSON.parse(raw) as unknown
  } catch {
    throw new Error(`Upload: resposta inválida do gateway (${response.status})`)
  }
  if (!response.ok) {
    throw new Error(gatewayErrorMessage(data, response.status))
  }
  const url = mediaUrlFromGateway(data)
  if (!url) throw new Error("A biblioteca não devolveu URL")
  return url
}

async function generateWithOpenAI(
  cfg: { apiKey: string; baseUrl: string; imageModel: string; quality: string },
  prompt: string,
  size: string,
  options?: { transparent?: boolean },
) {
  const payload: Record<string, unknown> = {
    model: cfg.imageModel,
    prompt: prompt.slice(0, 3900),
    size,
    n: 1,
  }

  // GPT Image: quality low|medium|high|auto; sempre devolve b64_json (sem response_format).
  // DALL·E 3 legado: quality hd|standard — só se alguém forçar MARKETING_IMAGE_MODEL=dall-e-3.
  if (isGptImageModel(cfg.imageModel)) {
    payload.quality = cfg.quality
    if (options?.transparent) {
      payload.background = "transparent"
      payload.output_format = "png"
    }
  } else if (cfg.imageModel.startsWith("dall-e-3")) {
    payload.quality = "standard"
  }

  const gen = await fetch(`${cfg.baseUrl}/images/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(80000),
  })

  const parsed = await readJsonBody<{
    error?: { message?: string; code?: string; type?: string }
    data?: Array<{ url?: string; b64_json?: string }>
  }>(gen)

  if (!parsed.ok) {
    return { error: parsed.error, status: parsed.status }
  }
  if (!gen.ok) {
    return { error: openaiErrorMessage(parsed.data, gen.status), status: gen.status }
  }

  const asset = parsed.data.data?.[0]
  if (!asset) {
    return { error: "O modelo não devolveu imagem.", status: 502 }
  }

  // GPT Image devolve sempre b64_json; DALL·E pode devolver url.
  if (asset.b64_json) {
    const bytes = Uint8Array.from(Buffer.from(asset.b64_json, "base64"))
    return { bytes }
  }
  if (asset.url) {
    const downloaded = await fetch(asset.url, { signal: AbortSignal.timeout(30000) })
    if (!downloaded.ok) {
      return { error: "Não foi possível descarregar a imagem gerada.", status: 502 }
    }
    const bytes = new Uint8Array(await downloaded.arrayBuffer())
    return { bytes }
  }
  return { error: "O modelo não devolveu URL nem base64.", status: 502 }
}

export async function POST(request: Request) {
  try {
    const { error } = await requireModuleWriteSession("marketing")
    if (error) return error

    const cfg = llmConfig()
    if ("error" in cfg) {
      return NextResponse.json({ error: cfg.error }, { status: 503 })
    }

    const body = (await request.json().catch(() => null)) as {
      prompt?: string
      format?: string
      campaignId?: string
    } | null
    const prompt = body?.prompt?.trim()
    const format = (body?.format?.trim() || "feed") as FormatKey
    if (!prompt) {
      return NextResponse.json({ error: "Escreve um prompt." }, { status: 400 })
    }
    if (!(format in FORMATS)) {
      return NextResponse.json({ error: "Formato inválido." }, { status: 400 })
    }

    const size = FORMATS[format].size
    const siteUrl = storefrontDisplayUrl()
    const fullPrompt = buildImagePrompt(prompt, format, siteUrl)
    const cutout = format === "banner"

    let generated = await generateWithOpenAI(cfg, fullPrompt, size, { transparent: cutout })
    if (
      cutout &&
      "error" in generated &&
      generated.error &&
      /background|output_format|transparent/i.test(generated.error)
    ) {
      generated = await generateWithOpenAI(cfg, fullPrompt, size)
    }
    if ("error" in generated && generated.error) {
      return NextResponse.json(
        { error: generated.error },
        { status: generated.status >= 400 && generated.status < 600 ? generated.status : 502 },
      )
    }
    if (!("bytes" in generated) || !generated.bytes) {
      return NextResponse.json({ error: "Geração sem imagem." }, { status: 502 })
    }

    const built = blobFromBytes(generated.bytes)
    const validationError = await validateImageBlob(built.blob, "file")
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const url = await uploadToLibrary(built.blob, `marketing-${format}-${Date.now()}.${built.ext}`)
    await recordMarketingImage({ url, format, prompt })
    try {
      const campaignId = body?.campaignId?.trim()
      if (campaignId) {
        await attachMarketingCampaignAssets(campaignId, { imageUrls: [url] })
      } else {
        const live = await getLiveMarketingCampaign()
        if (live?.id) await attachMarketingCampaignAssets(live.id, { imageUrls: [url] })
      }
    } catch {
      // Imagem já está na biblioteca.
    }

    return NextResponse.json({ url, format, prompt, model: cfg.imageModel })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha a gerar imagem"
    const status =
      message.includes("Timeout") || message.includes("timeout") || message.includes("aborted")
        ? 504
        : 500
    return NextResponse.json({ error: message }, { status })
  }
}
