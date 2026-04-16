import { NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/auth/requireAdmin"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireAdminSession()
    if (error) return error

    const gtwUrl = process.env.GTW_URL
    const cmsAccessToken = process.env.CMS_ACCESS_TOKEN
    const { id: bannerId } = await params

    if (!gtwUrl || !cmsAccessToken) {
      return NextResponse.json(
        { error: "Payment gateway configuration missing" },
        { status: 500 }
      )
    }

    // Obter FormData da requisição
    const formData = await request.formData()

    // Fazer proxy para o backend Java
    const response = await fetch(`${gtwUrl}/api/banner/update/${bannerId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${cmsAccessToken}`,
      },
      body: formData,
    })

    let data
    try {
      data = await response.json()
    } catch (e) {
      return NextResponse.json(
        { error: `Failed to update banner: ${response.statusText}` },
        { status: response.status }
      )
    }

    if (!response.ok) {
      return NextResponse.json(
        { 
          error: data.error || data.message || "Failed to update banner",
          details: data
        },
        { status: response.status }
      )
    }

    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error("Banner update API error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

