import { NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/auth/requireAdmin"
import { rateLimit } from "@/lib/security/rate-limit"

const STRICT_LIMIT = { maxRequests: 5, windowMs: 60_000 }

function gtwHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.CMS_ACCESS_TOKEN}`,
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimited = rateLimit(request.headers.get("x-forwarded-for") ?? request.ip ?? null, STRICT_LIMIT)
    if (rateLimited) return rateLimited

    const { error } = await requireAdminSession()
    if (error) return error

    const body = await request.json().catch(() => ({}))
    const url = `${process.env.GTW_URL}/api/security/tokens/generate`

    const res = await fetch(url, {
      method: "POST",
      headers: gtwHeaders(),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    })

    const text = await res.text()

    let data
    try {
      data = JSON.parse(text)
    } catch {
      return NextResponse.json({ error: `Backend retornou status ${res.status}: ${text.slice(0, 200)}` }, { status: 500 })
    }

    return NextResponse.json(data, { status: res.status })
  } catch (error: any) {
    console.error("[security/tokens/generate] fetch error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
