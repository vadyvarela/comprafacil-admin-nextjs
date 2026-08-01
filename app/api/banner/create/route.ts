import { NextRequest, NextResponse } from "next/server"
import { requireModuleWriteSession } from "@/lib/auth/requireRole"
import { validateImageFormData } from "@/lib/security/upload-validation"
import { getErrorMessage } from "@/lib/utils/errors"

export async function POST(request: NextRequest) {
  try {
    const { error } = await requireModuleWriteSession("banners")
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
    const validationError = await validateImageFormData(formData)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    // Fazer proxy para o backend Java
    const response = await fetch(`${gtwUrl}/api/banner/create`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cmsAccessToken}`,
      },
      body: formData,
      signal: AbortSignal.timeout(120000),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || "Failed to create banner" },
        { status: response.status }
      )
    }

    return NextResponse.json(data, { status: response.status })
  } catch (error: unknown) {
    console.error("Banner creation API error:", error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}

