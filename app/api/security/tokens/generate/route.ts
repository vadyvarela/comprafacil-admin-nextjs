import { NextRequest, NextResponse } from "next/server"
import { requireOwnerSession } from "@/lib/auth/requireRole"
import { rateLimit } from "@/lib/security/rate-limit"
import { getErrorMessage } from "@/lib/utils/errors"

const STRICT_LIMIT = { maxRequests: 5, windowMs: 60_000 }

function getGatewayConfig() {
  const gtwUrl = process.env.GTW_URL
  const token = process.env.CMS_ACCESS_TOKEN
  if (!gtwUrl || !token) return null

  return {
    url: `${gtwUrl}/api/security/tokens/generate`,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimited = rateLimit(request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? null, STRICT_LIMIT)
    if (rateLimited) return rateLimited

    const { error } = await requireOwnerSession()
    if (error) return error

    const body = await request.json().catch(() => ({}))
    const cfg = getGatewayConfig()
    if (!cfg) {
      return NextResponse.json({ error: "Gateway configuration missing" }, { status: 500 })
    }

    const res = await fetch(cfg.url, {
      method: "POST",
      headers: cfg.headers,
      body: JSON.stringify(body),
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
    console.error("[security/tokens/generate] fetch error:", error)
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
  }
}
