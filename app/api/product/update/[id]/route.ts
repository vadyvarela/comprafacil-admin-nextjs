import { NextRequest, NextResponse } from "next/server"
import { requireModuleWriteSession } from "@/lib/auth/requireRole"
import { validateImageFormData } from "@/lib/security/upload-validation"
import { getErrorMessage } from "@/lib/utils/errors"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireModuleWriteSession("products")
    if (error) return error

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
    const validationError = await validateImageFormData(formData)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    // Fazer proxy para o backend Java usando endpoint específico para multipart
    const response = await fetch(`${gtwUrl}/api/product/update/${productId}/with-image`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${cmsAccessToken}`,
      },
      body: formData,
      signal: AbortSignal.timeout(120000),
    })

    let data
    try {
      data = await response.json()
    } catch {
      // Se não conseguir parsear JSON, retornar erro genérico
      return NextResponse.json(
        { error: `Failed to update product: ${response.statusText}` },
        { status: response.status }
      )
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || data.message || "Failed to update product" },
        { status: response.status }
      )
    }

    return NextResponse.json(data, { status: response.status })
  } catch (error: unknown) {
    console.error("Product update API error:", error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}

