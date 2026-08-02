import { NextRequest } from "next/server"
import { requireStoreSession } from "@/lib/auth/requireRole"
import { proxyGatewayPdf } from "@/lib/proxy-gateway-pdf"

export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { error } = await requireStoreSession()
  if (error) return error

  const { id } = await context.params
  return proxyGatewayPdf({
    kind: "receipt",
    documentId: id,
    dlFromQuery: request.nextUrl.searchParams.get("dl"),
  })
}
