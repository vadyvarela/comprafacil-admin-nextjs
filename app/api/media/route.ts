import { NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/auth/requireAdmin"

function requireGtw() {
  const gtwUrl = process.env.GTW_URL
  const cmsAccessToken = process.env.CMS_ACCESS_TOKEN
  if (!gtwUrl || !cmsAccessToken) {
    return { error: NextResponse.json({ error: "Payment gateway configuration missing" }, { status: 500 }) }
  }
  return { gtwUrl, cmsAccessToken }
}

export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAdminSession()
    if (error) return error

    const cfg = requireGtw()
    if ("error" in cfg) return cfg.error

    const { searchParams } = new URL(request.url)
    const page = searchParams.get("page") ?? "0"
    const size = searchParams.get("size") ?? "24"
    const group = searchParams.get("group")
    const qsParams: Record<string, string> = { page, size }
    if (group != null && group !== "") qsParams.group = group
    const qs = new URLSearchParams(qsParams).toString()

    const response = await fetch(`${cfg.gtwUrl}/api/media?${qs}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${cfg.cmsAccessToken}`,
      },
      signal: AbortSignal.timeout(30000),
    })

    const data = await response.json().catch(() => ({}))
    return NextResponse.json(data, { status: response.status })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error } = await requireAdminSession()
    if (error) return error

    const cfg = requireGtw()
    if ("error" in cfg) return cfg.error

    const formData = await request.formData()
    const outbound = new FormData()
    const file = formData.get("file") ?? formData.get("image")
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "Nenhum ficheiro fornecido" }, { status: 400 })
    }
    outbound.append("file", file)
    const group = formData.get("group")
    if (typeof group === "string" && group.trim()) outbound.append("group", group.trim())
    const source = formData.get("source")
    if (typeof source === "string" && source.trim()) outbound.append("source", source.trim())

    const response = await fetch(`${cfg.gtwUrl}/api/media`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.cmsAccessToken}`,
      },
      body: outbound,
      signal: AbortSignal.timeout(120000),
    })

    const data = await response.json().catch(() => ({}))
    return NextResponse.json(data, { status: response.status })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
