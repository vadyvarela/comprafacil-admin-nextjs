import { NextRequest } from "next/server"
import { proxyGatewayPdf } from "@/lib/proxy-gateway-pdf"
import { requirePermissionApi } from "@/lib/auth/requirePermission"

export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { error } = await requirePermissionApi("transactions.documents.read")
  if (error) return error

  const { id } = await context.params
  return proxyGatewayPdf({
    kind: "invoice",
    documentId: id,
    dlFromQuery: request.nextUrl.searchParams.get("dl"),
  })
}
