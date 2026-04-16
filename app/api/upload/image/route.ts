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
    const imageFile = formData.get("image") as File

    if (!imageFile) {
      return NextResponse.json(
        { error: "Nenhuma imagem fornecida" },
        { status: 400 }
      )
    }

    // Criar novo FormData para enviar ao backend
    // Usar o endpoint de banner como workaround para fazer upload da imagem
    // Criar um banner temporário, obter a URL da imagem, e deletar o banner
    const uploadFormData = new FormData()
    uploadFormData.append("image", imageFile)
    
    // Criar um banner temporário apenas para fazer upload da imagem
    const bannerJson = JSON.stringify({
      title: `temp_upload_${Date.now()}`,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86400000).toISOString(), // +1 dia
      active: false,
    })
    uploadFormData.append("banner", bannerJson)

    // Fazer upload via endpoint de banner
    const response = await fetch(`${gtwUrl}/api/banner/create`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cmsAccessToken}`,
      },
      body: uploadFormData,
    })

    let data
    try {
      data = await response.json()
    } catch (e) {
      return NextResponse.json(
        { error: `Failed to upload image: ${response.statusText}` },
        { status: response.status }
      )
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          error: data.error || data.message || "Failed to upload image",
          details: data,
        },
        { status: response.status }
      )
    }

    // Extrair a URL da imagem do banner criado
    const imageUrl = data.data?.image

    if (!imageUrl) {
      // Tentar deletar o banner temporário
      if (data.data?.id) {
        try {
          await fetch(`${gtwUrl}/api/banner/${data.data.id}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${cmsAccessToken}`,
            },
          })
        } catch {
          // Ignore deletion errors
        }
      }
      return NextResponse.json(
        { error: "URL da imagem não retornada pelo servidor" },
        { status: 500 }
      )
    }

    // Deletar o banner temporário após obter a URL
    if (data.data?.id) {
      try {
        await fetch(`${gtwUrl}/api/banner/${data.data.id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${cmsAccessToken}`,
          },
        })
      } catch {
        // Ignore deletion errors - a imagem já foi uploadada com sucesso
      }
    }

    return NextResponse.json({ url: imageUrl, imageUrl }, { status: 200 })
  } catch (error: any) {
    console.error("Image upload API error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

