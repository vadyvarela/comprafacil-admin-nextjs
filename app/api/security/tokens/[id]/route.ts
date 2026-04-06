import { NextRequest, NextResponse } from "next/server"

function gtwHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.CMS_ACCESS_TOKEN}`,
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const res = await fetch(`${process.env.GTW_URL}/api/security/tokens/${id}`, {
      method: "DELETE",
      headers: gtwHeaders(),
      signal: AbortSignal.timeout(15000),
    })
    if (res.status === 204) return new NextResponse(null, { status: 204 })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { action } = await request.json()
    const res = await fetch(`${process.env.GTW_URL}/api/security/tokens/${id}/${action}`, {
      method: "PUT",
      headers: gtwHeaders(),
      signal: AbortSignal.timeout(15000),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
