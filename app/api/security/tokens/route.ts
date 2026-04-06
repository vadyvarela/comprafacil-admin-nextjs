import { NextResponse } from "next/server"

function gtwHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.CMS_ACCESS_TOKEN}`,
  }
}

export async function GET() {
  try {
    const url = `${process.env.GTW_URL}/api/security/tokens`
    console.log("[security/tokens] GET →", url)
    console.log("[security/tokens] CMS_ACCESS_TOKEN:", process.env.CMS_ACCESS_TOKEN ? "definido" : "VAZIO")

    const res = await fetch(url, {
      headers: gtwHeaders(),
      signal: AbortSignal.timeout(15000),
    })

    console.log("[security/tokens] status:", res.status)

    const text = await res.text()
    console.log("[security/tokens] body:", text.slice(0, 300))

    let data
    try {
      data = JSON.parse(text)
    } catch {
      return NextResponse.json({ error: `Backend retornou status ${res.status}: ${text.slice(0, 200)}` }, { status: 500 })
    }

    return NextResponse.json(data, { status: res.status })
  } catch (error: any) {
    console.error("[security/tokens] fetch error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
