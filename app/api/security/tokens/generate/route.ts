import { NextRequest, NextResponse } from "next/server"

function gtwHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.CMS_ACCESS_TOKEN}`,
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const url = `${process.env.GTW_URL}/api/security/tokens/generate`
    console.log("[security/tokens/generate] POST →", url)
    console.log("[security/tokens/generate] CMS_ACCESS_TOKEN:", process.env.CMS_ACCESS_TOKEN ? "definido" : "VAZIO")

    const res = await fetch(url, {
      method: "POST",
      headers: gtwHeaders(),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    })

    console.log("[security/tokens/generate] status:", res.status)

    const text = await res.text()
    console.log("[security/tokens/generate] body:", text.slice(0, 300))

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
