import { NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/auth/requireAdmin"

export async function POST(request: NextRequest) {
  try {
    const { error } = await requireAdminSession()
    if (error) return error

    const gtwUrl = process.env.GTW_URL
    const cmsAccessToken = process.env.CMS_ACCESS_TOKEN

    if (!gtwUrl || !cmsAccessToken) {
      return NextResponse.json(
        { error: "Payment gateway configuration missing" },
        { status: 500 }
      )
    }

    // Obter FormData da requisição
    const formData = await request.formData()

    // Fazer proxy para o backend Java
    const response = await fetch(`${gtwUrl}/api/product/create`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cmsAccessToken}`,
      },
      body: formData,
    })

    let data
    try {
      data = await response.json()
    } catch {
      return NextResponse.json(
        { error: "Failed to create product" },
        { status: response.status || 500 }
      )
    }

    if (!response.ok) {
      const errorMessage = data.data?.uiMessage || "Failed to create product"
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      )
    }

    return NextResponse.json(data, { status: response.status })
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

