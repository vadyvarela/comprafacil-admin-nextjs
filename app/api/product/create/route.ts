import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
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

    // Log do que está sendo enviado (apenas para debug - remover em produção)
    const productJson = formData.get("product") as string
    if (productJson) {
      try {
        const productData = JSON.parse(productJson)
        console.log("[DEBUG] Product data being sent:", JSON.stringify(productData, null, 2))
      } catch (e) {
        console.error("[ERROR] Failed to parse product JSON:", e)
      }
    } else {
      console.error("[ERROR] No product JSON found in FormData")
    }

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
    } catch (e) {
      const text = await response.text()
      console.error("Failed to parse response as JSON:", text)
      return NextResponse.json(
        { error: `Failed to create product: ${response.statusText}` },
        { status: response.status || 500 }
      )
    }

    if (!response.ok) {
      console.error("Backend error response:", data)
      
      // Tentar extrair mensagem mais útil do erro
      let errorMessage = "Failed to create product"
      if (data.data?.uiMessage) {
        errorMessage = data.data.uiMessage
      } else if (data.data?.technicalMessage) {
        errorMessage = data.data.technicalMessage
      } else if (data.message) {
        errorMessage = data.message
      } else if (data.error) {
        errorMessage = data.error
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: data
        },
        { status: response.status }
      )
    }

    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error("Product creation API error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

