import { NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/auth/requireAdmin"

function extractApiError(data: Record<string, unknown>): string {
  const d = data?.data as Record<string, unknown> | undefined
  if (d && typeof d.uiMessage === "string" && d.uiMessage) return d.uiMessage
  if (d && typeof d.technicalMessage === "string" && d.technicalMessage) return d.technicalMessage
  if (typeof data?.error === "string") return data.error
  if (typeof data?.data === "string") return data.data
  return "Erro ao fazer upload da imagem"
}

export async function POST(request: NextRequest) {
  try {
    const { error } = await requireAdminSession()
    if (error) return error

    const gtwUrl = process.env.GTW_URL
    const cmsAccessToken = process.env.CMS_ACCESS_TOKEN

    if (!gtwUrl || !cmsAccessToken) {
      return NextResponse.json(
        { error: "Payment gateway configuration missing" },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const imageFile = formData.get("image") as File | null

    if (!imageFile) {
      return NextResponse.json(
        { error: "Nenhuma imagem fornecida" },
        { status: 400 }
      )
    }

    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"]
    const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

    if (!ALLOWED_TYPES.includes(imageFile.type)) {
      return NextResponse.json(
        { error: `Tipo de ficheiro não permitido: ${imageFile.type}. Use JPEG, PNG, WebP, GIF ou SVG.` },
        { status: 400 }
      )
    }

    if (imageFile.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Ficheiro demasiado grande. Tamanho máximo: 10 MB." },
        { status: 400 }
      )
    }

    const uploadFormData = new FormData()
    uploadFormData.append("file", imageFile)
    const src = formData.get("source")
    if (typeof src === "string" && src.trim()) uploadFormData.append("source", src.trim())
    const grp = formData.get("group")
    if (typeof grp === "string" && grp.trim()) uploadFormData.append("group", grp.trim())

    const response = await fetch(`${gtwUrl}/api/media`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cmsAccessToken}`,
      },
      body: uploadFormData,
      signal: AbortSignal.timeout(120000),
    })

    let data: Record<string, unknown>
    try {
      data = (await response.json()) as Record<string, unknown>
    } catch {
      return NextResponse.json(
        { error: "Failed to upload image" },
        { status: response.status }
      )
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: extractApiError(data) },
        { status: response.status }
      )
    }

    const payload = data.data as Record<string, unknown> | undefined
    const imageUrl =
      (typeof payload?.url === "string" && payload.url) ||
      (typeof payload?.imageUrl === "string" && payload.imageUrl) ||
      ""

    if (!imageUrl) {
      return NextResponse.json(
        { error: "URL da imagem não retornada pelo servidor" },
        { status: 500 }
      )
    }

    return NextResponse.json({ url: imageUrl, imageUrl }, { status: 200 })
  } catch (error: unknown) {
    console.error("Image upload API error:", error)
    const message = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
