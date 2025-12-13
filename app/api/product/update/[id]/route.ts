import { NextRequest, NextResponse } from "next/server"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const gtwUrl = process.env.GTW_URL
    const cmsAccessToken = process.env.CMS_ACCESS_TOKEN
    const { id: productId } = await params

    if (!gtwUrl || !cmsAccessToken) {
      return NextResponse.json(
        { error: "Payment gateway configuration missing" },
        { status: 500 }
      )
    }

    // Obter FormData da requisição
    const formData = await request.formData()

    // Fazer proxy para o backend Java usando endpoint específico para multipart
    const response = await fetch(`${gtwUrl}/api/product/update/${productId}/with-image`, {
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
      // Se não conseguir parsear JSON, retornar erro genérico
      return NextResponse.json(
        { error: `Failed to update product: ${response.statusText}` },
        { status: response.status }
      )
    }

    if (!response.ok) {
      return NextResponse.json(
        { 
          error: data.error || data.message || "Failed to update product",
          details: data
        },
        { status: response.status }
      )
    }

    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error("Product update API error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

