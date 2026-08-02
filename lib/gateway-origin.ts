/**
 * Links de PDF via proxy local (/api/invoice|receipt/pdf/:id).
 * O browser nunca aponta para o host Railway do gateway.
 */

/** Reescreve URL absoluta do gateway → caminho relativo da app. */
export function toProxiedDocumentUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null
  const trimmed = url.trim()

  try {
    const u = new URL(trimmed)
    if (
      u.pathname.includes("/api/invoice/pdf/") ||
      u.pathname.includes("/api/receipt/pdf/")
    ) {
      return `${u.pathname}${u.search}`
    }
  } catch {
    if (
      trimmed.startsWith("/api/invoice/pdf/") ||
      trimmed.startsWith("/api/receipt/pdf/")
    ) {
      return trimmed
    }
  }

  return ensurePdfExtension(trimmed)
}

export function invoicePdfHref(
  _origin: string | null | undefined,
  invoiceId: string | null | undefined
): string | null {
  if (!invoiceId?.trim()) return null
  return `/api/invoice/pdf/${invoiceId.trim()}`
}

export function receiptPdfHref(
  _origin: string | null | undefined,
  receiptId: string | null | undefined
): string | null {
  if (!receiptId?.trim()) return null
  return `/api/receipt/pdf/${receiptId.trim()}`
}

/** @deprecated Preferir toProxiedDocumentUrl / hrefs relativos. Mantido para compat. */
export function gatewayOriginFromEnv(): string | null {
  return null
}

export function originFromGraphqlEndpoint(gtwUrl: string | undefined): string | null {
  if (!gtwUrl?.trim()) return null
  try {
    return new URL(gtwUrl).origin
  } catch {
    return null
  }
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
