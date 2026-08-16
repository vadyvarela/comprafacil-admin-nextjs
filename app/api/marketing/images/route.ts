import { NextResponse } from "next/server"
import { requireModuleWriteSession } from "@/lib/auth/requireRole"
import { recordMarketingImage } from "@/lib/actions/marketing"
import { validateImageBlob } from "@/lib/security/upload-validation"

export const maxDuration = 90

const FORMATS = {
  feed: { size: "1024x1024", label: "Feed" },
  stories: { size: "1024x1792", label: "Stories" },
  banner: { size: "1792x1024", label: "Banner" },
} as const

type FormatKey = keyof typeof FORMATS

function llmConfig() {
  const apiKey = process.env.MARKETING_AGENT_API_KEY
  if (!apiKey) {
    return { error: "Falta MARKETING_AGENT_API_KEY no servidor do backoffice." }
  }
  return {
    apiKey,
    imageModel: process.env.MARKETING_IMAGE_MODEL?.trim() || "dall-e-3",
    baseUrl: (process.env.MARKETING_AGENT_BASE_URL?.replace(/\/$/, "") || "https://api.openai.com/v1"),
  }
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
    return { error: "Configuração do gateway em falta" }
  }
  return { gtwUrl, cmsAccessToken }
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
  const data = (await response.json().catch(() => ({}))) as { url?: string; secureUrl?: string; error?: string }
  if (!response.ok) {
    throw new Error(data.error || `Upload ${response.status}`)
  }
  const url = data.url || data.secureUrl
  if (!url) throw new Error("A biblioteca não devolveu URL")
  return url
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
    const fullPrompt = [
      prompt,
      "Professional retail campaign visual for a Cape Verde electronics store.",
      "Clean composition, high-end commercial photography/graphic, no fake brand logos, no watermark, no misspelled text if any text appears.",
    ].join(" ")

    const gen = await fetch(`${cfg.baseUrl}/images/generations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: cfg.imageModel,
        prompt: fullPrompt,
        size,
        n: 1,
      }),
      signal: AbortSignal.timeout(80000),
    })
    const json = (await gen.json()) as {
      error?: { message?: string }
      data?: Array<{ url?: string; b64_json?: string }>
    }
    if (!gen.ok) {
      return NextResponse.json(
        { error: json.error?.message || `Geração ${gen.status}` },
        { status: 502 },
      )
    }

    const asset = json.data?.[0]
    let blob: Blob
    let ext = "png"
    if (asset?.b64_json) {
      const bytes = Uint8Array.from(Buffer.from(asset.b64_json, "base64"))
      const built = blobFromBytes(bytes)
      blob = built.blob
      ext = built.ext
    } else if (asset?.url) {
      const downloaded = await fetch(asset.url, { signal: AbortSignal.timeout(30000) })
      if (!downloaded.ok) throw new Error("Não foi possível descarregar a imagem gerada")
      const bytes = new Uint8Array(await downloaded.arrayBuffer())
      const built = blobFromBytes(bytes)
      blob = built.blob
      ext = built.ext
    } else {
      throw new Error("O modelo não devolveu imagem")
    }

    const validationError = await validateImageBlob(blob, "file")
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const url = await uploadToLibrary(blob, `marketing-${format}-${Date.now()}.${ext}`)
    await recordMarketingImage({ url, format, prompt })

    return NextResponse.json({ url, format, prompt })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha a gerar imagem"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
