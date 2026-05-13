import { NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/auth/requireAdmin"

function requireGtw() {
  const gtwUrl = process.env.GTW_URL
  const cmsAccessToken = process.env.CMS_ACCESS_TOKEN
  if (!gtwUrl || !cmsAccessToken) {
    return { error: NextResponse.json({ error: "Payment gateway configuration missing" }, { status: 500 }) }
  }
  return { gtwUrl, cmsAccessToken }
}

export async function GET() {
  try {
    const { error } = await requireAdminSession()
    if (error) return error

    const cfg = requireGtw()
    if ("error" in cfg) return cfg.error

    const response = await fetch(`${cfg.gtwUrl}/api/media/groups`, {
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
