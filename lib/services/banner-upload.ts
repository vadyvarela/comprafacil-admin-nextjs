/**
 * Service para criação e atualização de banners com imagem
 */

/**
 * Cria banner com imagem via API route do Next.js
 */
export async function createBannerWithImage(
  bannerData: {
    title: string
    subtitle?: string | null
    description?: string | null
    image?: string | null
    link?: string | null
    buttonText?: string | null
    position?: string | null
    orderIndex?: number | null
    status?: { code: string; description: string } | null
    startDate?: string | null
    endDate?: string | null
  },
  imageFile?: File
): Promise<{ id: string; image?: string }> {
  const formData = new FormData()
  
  // Adicionar dados do banner como JSON
  formData.append(
    "banner",
    JSON.stringify({
      title: bannerData.title,
      subtitle: bannerData.subtitle || null,
      description: bannerData.description || null,
      image: bannerData.image || null,
      link: bannerData.link || null,
      buttonText: bannerData.buttonText || null,
      position: bannerData.position || "hero",
      orderIndex: bannerData.orderIndex || 0,
      status: bannerData.status || null,
      startDate: bannerData.startDate || null,
      endDate: bannerData.endDate || null,
    })
  )

  // Adicionar imagem se fornecida
  if (imageFile) {
    formData.append("image", imageFile)
  }

  try {
    const response = await fetch("/api/banner/create", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.error || errorData.message || `Failed to create banner: ${response.statusText}`
      )
    }

    const data = await response.json()
    
    if (data.data) {
      return {
        id: data.data.id,
        image: data.data.image,
      }
    }

    throw new Error("No banner data in response")
  } catch (error: any) {
    console.error("Error creating banner with image:", error)
    throw new Error(error.message || "Failed to create banner")
  }
}

/**
 * Atualiza banner com imagem via API route do Next.js
 */
export async function updateBannerWithImage(
  bannerId: string,
  bannerData: {
    title: string
    subtitle?: string | null
    description?: string | null
    image?: string | null
    link?: string | null
    buttonText?: string | null
    position?: string | null
    orderIndex?: number | null
    status?: { code: string; description: string } | null
    startDate?: string | null
    endDate?: string | null
  },
  imageFile?: File
): Promise<{ id: string; image?: string }> {
  // Se há uma nova imagem, usar multipart/form-data
  if (imageFile) {
    const formData = new FormData()
    
    formData.append(
      "banner",
      JSON.stringify({
        title: bannerData.title,
        subtitle: bannerData.subtitle || null,
        description: bannerData.description || null,
        image: bannerData.image || null,
        link: bannerData.link || null,
        buttonText: bannerData.buttonText || null,
        position: bannerData.position || "hero",
        orderIndex: bannerData.orderIndex || 0,
        status: bannerData.status || null,
        startDate: bannerData.startDate || null,
        endDate: bannerData.endDate || null,
      })
    )
    
    formData.append("image", imageFile)

    try {
      const response = await fetch(`/api/banner/update/${bannerId}`, {
        method: "PUT",
        body: formData,
      })

      if (!response.ok) {
        let errorData: any = {}
        try {
          errorData = await response.json()
        } catch (e) {
          errorData = { error: response.statusText }
        }
        
        const errorMessage = errorData.error || errorData.message || `Failed to update banner: ${response.statusText}`
        console.error("Update banner error:", errorData)
        throw new Error(errorMessage)
      }

      const data = await response.json()
      
      if (response.ok) {
        let bannerIdFromResponse = bannerId
        let imageFromResponse: string | null = null

        if (data.data) {
          bannerIdFromResponse = data.data.id || bannerId
          imageFromResponse = data.data.image || null
        } else if (data.id) {
          bannerIdFromResponse = data.id
          imageFromResponse = data.image || null
        }

        if (!data.data && !data.id) {
          console.warn("Banner updated successfully but response structure is unexpected:", data)
        }

        return {
          id: bannerIdFromResponse,
          image: imageFromResponse ?? undefined,
        }
      }

      throw new Error("No banner data in response")
    } catch (error: any) {
      console.error("Error updating banner with image:", error)
      throw new Error(error.message || "Failed to update banner")
    }
  } else {
    // Se não há nova imagem, retornar null para usar GraphQL
    return { id: bannerId }
  }
}

