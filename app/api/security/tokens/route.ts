import { NextResponse } from "next/server"
import { requireOwnerSession } from "@/lib/auth/requireRole"
import { getErrorMessage } from "@/lib/utils/errors"

function getGatewayConfig() {
  const gtwUrl = process.env.GTW_URL
  const token = process.env.CMS_ACCESS_TOKEN
  if (!gtwUrl || !token) return null

  return {
    url: `${gtwUrl}/api/security/tokens`,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  }
}

export async function GET() {
  try {
    const { error } = await requireOwnerSession()
    if (error) return error

    const cfg = getGatewayConfig()
    if (!cfg) {
      return NextResponse.json({ error: "Gateway configuration missing" }, { status: 500 })
    }

    const res = await fetch(cfg.url, {
      headers: cfg.headers,
      signal: AbortSignal.timeout(15000),
    })

    const text = await res.text()

    let data
    try {
      data = JSON.parse(text)
    } catch {
      return NextResponse.json({ error: "Invalid gateway response" }, { status: 502 })
    }

    return NextResponse.json(data, { status: res.status })
  } catch (error: unknown) {
    console.error("[security/tokens] fetch error:", error)
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
  }
}
