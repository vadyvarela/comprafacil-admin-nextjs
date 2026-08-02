import "server-only"
import { createHmac } from "crypto"
import { NextResponse } from "next/server"

const DOCUMENT_TTL_SECONDS = 31_536_000

/** Mesmo algoritmo que kumprahub-api DocumentDownloadTokenService. */
export function createDocumentDownloadToken(documentId: string, secret: string): string {
  const exp = Math.floor(Date.now() / 1000) + DOCUMENT_TTL_SECONDS
  const payload = `${documentId}:${exp}`
  const sig = createHmac("sha256", secret).update(payload, "utf8").digest("base64url")
  return Buffer.from(`${payload}:${sig}`, "utf8").toString("base64url")
}

export async function proxyGatewayPdf(opts: {
  kind: "invoice" | "receipt"
  documentId: string
  dlFromQuery: string | null
}): Promise<NextResponse> {
  const gtwUrl = process.env.GTW_URL?.replace(/\/$/, "")
  const apiToken =
    process.env.KUMPRAFACIL_API_TOKEN?.trim() ||
    process.env.CMS_ACCESS_TOKEN?.trim()
  if (!gtwUrl || !apiToken) {
    return NextResponse.json({ error: "Gateway not configured" }, { status: 500 })
  }

  const id = opts.documentId.trim()
  if (!id || id.length > 128 || !/^[a-zA-Z0-9_-]+$/.test(id)) {
    return NextResponse.json({ error: "Invalid document id" }, { status: 400 })
  }

  const dl =
    opts.dlFromQuery?.trim() ||
    createDocumentDownloadToken(id, process.env.KUMPRAFACIL_API_TOKEN?.trim() || apiToken)

  const qs = new URLSearchParams({ dl })
  const upstreamUrl = `${gtwUrl}/api/${opts.kind}/pdf/${encodeURIComponent(id)}?${qs}`

  try {
    const upstream = await fetch(upstreamUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
      signal: AbortSignal.timeout(60_000),
    })

    if (!upstream.ok) {
      return new NextResponse(null, { status: upstream.status === 403 ? 403 : upstream.status })
    }

    const bytes = await upstream.arrayBuffer()
    const contentType = upstream.headers.get("content-type") || "application/pdf"
    const contentDisposition =
      upstream.headers.get("content-disposition") ||
      `inline; filename="${opts.kind}-${id}.pdf"`

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition,
        "Cache-Control": "private, no-store",
      },
    })
  } catch {
    return NextResponse.json({ error: "Failed to fetch document" }, { status: 502 })
  }
}
