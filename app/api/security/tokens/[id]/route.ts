import { NextRequest, NextResponse } from "next/server"
import { requireOwnerSession } from "@/lib/auth/requireRole"
import { getErrorMessage } from "@/lib/utils/errors"

const ALLOWED_TOKEN_ACTIONS = ["activate", "deactivate"] as const
type TokenAction = (typeof ALLOWED_TOKEN_ACTIONS)[number]

function isAllowedTokenAction(action: unknown): action is TokenAction {
  return (
    typeof action === "string" &&
    (ALLOWED_TOKEN_ACTIONS as readonly string[]).includes(action)
  )
}

function getGatewayConfig() {
  const gtwUrl = process.env.GTW_URL
  const token = process.env.CMS_ACCESS_TOKEN
  if (!gtwUrl || !token) return null

  return {
    baseUrl: `${gtwUrl}/api/security/tokens`,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireOwnerSession()
    if (error) return error

    const { id } = await params
    const cfg = getGatewayConfig()
    if (!cfg) {
      return NextResponse.json({ error: "Gateway configuration missing" }, { status: 500 })
    }

    const encodedId = encodeURIComponent(id)
    const res = await fetch(`${cfg.baseUrl}/${encodedId}`, {
      method: "DELETE",
      headers: cfg.headers,
      signal: AbortSignal.timeout(15000),
    })
    if (res.status === 204) return new NextResponse(null, { status: 204 })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireOwnerSession()
    if (error) return error

    const { id } = await params
    const { action } = (await request.json().catch(() => ({}))) as { action?: string }

    if (!isAllowedTokenAction(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const cfg = getGatewayConfig()
    if (!cfg) {
      return NextResponse.json({ error: "Gateway configuration missing" }, { status: 500 })
    }

    const encodedId = encodeURIComponent(id)
    const res = await fetch(`${cfg.baseUrl}/${encodedId}/${action}`, {
      method: "PUT",
      headers: cfg.headers,
      signal: AbortSignal.timeout(15000),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
  }
}
