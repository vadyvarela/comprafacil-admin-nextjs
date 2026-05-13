import { NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/auth/requireAdmin"

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireAdminSession()
    if (error) return error

    const gtwUrl = process.env.GTW_URL
    const cmsAccessToken = process.env.CMS_ACCESS_TOKEN

    if (!gtwUrl || !cmsAccessToken) {
      return NextResponse.json({ error: "Payment gateway configuration missing" }, { status: 500 })
    }

    const { id } = await params
    const response = await fetch(`${gtwUrl}/api/media/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${cmsAccessToken}`,
      },
      signal: AbortSignal.timeout(60000),
    })

    const data = await response.json().catch(() => ({}))
    return NextResponse.json(data, { status: response.status })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
