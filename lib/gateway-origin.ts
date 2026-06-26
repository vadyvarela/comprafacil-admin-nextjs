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

/** Garante extensão .pdf em URLs Cloudinary raw sem extensão. */
export function ensurePdfExtension(url: string | null | undefined): string | null {
  if (!url?.trim()) return null
  const trimmed = url.trim()
  if (!trimmed.includes("res.cloudinary.com") || !trimmed.includes("/raw/upload/")) {
    return trimmed
  }
  const lower = trimmed.toLowerCase()
  if (lower.includes(".pdf")) return trimmed
  const query = trimmed.indexOf("?")
  if (query > 0) return `${trimmed.slice(0, query)}.pdf${trimmed.slice(query)}`
  return `${trimmed}.pdf`
}
