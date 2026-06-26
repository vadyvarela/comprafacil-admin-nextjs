/**
 * Origem pública do gateway (REST PDF: /api/invoice/pdf/:id).
 * Preferir NEXT_PUBLIC_GTW_ORIGIN; senão derivar de GTW_URL (GraphQL).
 */
export function gatewayOriginFromEnv(): string | null {
  const explicit = process.env.NEXT_PUBLIC_GTW_ORIGIN?.trim()
  if (explicit) return explicit.replace(/\/$/, "")
  return originFromGraphqlEndpoint(process.env.GTW_URL)
}

export function originFromGraphqlEndpoint(gtwUrl: string | undefined): string | null {
  if (!gtwUrl?.trim()) return null
  try {
    const u = new URL(gtwUrl)
    return u.origin
  } catch {
    return null
  }
}

export function invoicePdfHref(origin: string | null | undefined, invoiceId: string | null | undefined): string | null {
  if (!origin?.trim() || !invoiceId?.trim()) return null
  return `${origin.replace(/\/$/, "")}/api/invoice/pdf/${invoiceId}`
}

export function receiptPdfHref(origin: string | null | undefined, receiptId: string | null | undefined): string | null {
  if (!origin?.trim() || !receiptId?.trim()) return null
  return `${origin.replace(/\/$/, "")}/api/receipt/pdf/${receiptId}`
}

/** Remove .pdf suffix from Cloudinary raw URLs (invalid path → 404). */
export function ensurePdfExtension(url: string | null | undefined): string | null {
  if (!url?.trim()) return null
  const trimmed = url.trim()
  if (!trimmed.includes("res.cloudinary.com") || !trimmed.includes("/raw/upload/")) {
    return trimmed
  }
  const query = trimmed.indexOf("?")
  const path = query > 0 ? trimmed.slice(0, query) : trimmed
  const suffix = query > 0 ? trimmed.slice(query) : ""
  if (!path.toLowerCase().endsWith(".pdf")) return trimmed
  return `${path.slice(0, -4)}${suffix}`
}
