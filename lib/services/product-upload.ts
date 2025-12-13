/**
 * Service para criação e atualização de produtos com imagem
 */

/**
 * Cria produto com imagem via API route do Next.js
 */
export async function createProductWithImage(
  productData: {
    title: string
    description?: string | null
    summary?: string | null
    discount?: number | null
    type: { code: string }
    metadata?: string | null
    categoryId?: string | null
    stockData?: {
      name: string
      quantity: number
    }
  },
  imageFile?: File
): Promise<{ id: string; image?: string }> {
  const formData = new FormData()
  
  // Construir objeto do produto
  const productPayload: any = {
    title: productData.title,
    description: productData.description || null,
    summary: productData.summary || null,
    type: productData.type,
    metadata: productData.metadata || null,
  }

  // Adicionar campos opcionais apenas se não forem null/undefined
  if (productData.discount !== undefined && productData.discount !== null) {
    productPayload.discount = productData.discount
  }

  if (productData.categoryId) {
    productPayload.categoryId = productData.categoryId
  }

  // Adicionar stockData apenas se fornecido
  if (productData.stockData) {
    productPayload.stockData = productData.stockData
  }
  
  // Adicionar dados do produto como JSON
  formData.append("product", JSON.stringify(productPayload))

  // Adicionar imagem se fornecida
  if (imageFile) {
    formData.append("image", imageFile)
  }

  try {
    const response = await fetch("/api/product/create", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.error || errorData.message || `Failed to create product: ${response.statusText}`
      )
    }

    const data = await response.json()
    
    if (data.data) {
      return {
        id: data.data.id,
        image: data.data.image,
      }
    }

    throw new Error("No product data in response")
  } catch (error: any) {
    console.error("Error creating product with image:", error)
    throw new Error(error.message || "Failed to create product")
  }
}

/**
 * Atualiza produto com imagem via API route do Next.js
 */
export async function updateProductWithImage(
  productId: string,
  productData: {
    title: string
    description?: string | null
    summary?: string | null
    type?: { code: string }
    metadata?: string | null
    categoryId?: string | null
    image?: string | null
  },
  imageFile?: File
): Promise<{ id: string; image?: string }> {
  // Se há uma nova imagem, usar multipart/form-data
  if (imageFile) {
    const formData = new FormData()
    
      formData.append(
        "product",
        JSON.stringify({
          title: productData.title,
          description: productData.description || null,
          summary: productData.summary || null,
          discount: (productData as any).discount || null,
          type: productData.type || { code: "TICKET" },
          metadata: productData.metadata || null,
          categoryId: productData.categoryId || null,
          image: productData.image || null,
        })
      )
    
    formData.append("image", imageFile)

    try {
      const response = await fetch(`/api/product/update/${productId}`, {
        method: "PUT",
        body: formData,
      })

      if (!response.ok) {
        let errorData: any = {}
        try {
          errorData = await response.json()
        } catch (e) {
          // Se não conseguir parsear, usar status text
          errorData = { error: response.statusText }
        }
        
        const errorMessage = errorData.error || errorData.message || `Failed to update product: ${response.statusText}`
        console.error("Update product error:", errorData)
        throw new Error(errorMessage)
      }

      const data = await response.json()
      
      // A resposta do backend tem estrutura: { status, statusText, data: { id, image, ... } }
      // Se response.ok é true, a operação foi bem-sucedida, mesmo que a estrutura seja diferente
      if (response.ok) {
        // Tentar extrair dados da resposta
        let productIdFromResponse = productId
        let imageFromResponse: string | null = null

        if (data.data) {
          productIdFromResponse = data.data.id || productId
          imageFromResponse = data.data.image || null
        } else if (data.id) {
          // Caso a resposta venha diretamente sem wrapper
          productIdFromResponse = data.id
          imageFromResponse = data.image || null
        }

        // Se a estrutura for inesperada, logar mas não falhar
        if (!data.data && !data.id) {
          console.warn("Product updated successfully but response structure is unexpected:", data)
        }

        return {
          id: productIdFromResponse,
          image: imageFromResponse,
        }
      }

      // Se chegou aqui, response.ok é false, então há um erro real
      throw new Error("No product data in response")
    } catch (error: any) {
      console.error("Error updating product with image:", error)
      throw new Error(error.message || "Failed to update product")
    }
  } else {
    // Se não há nova imagem, retornar null para usar GraphQL
    return { id: productId }
  }
}

