import { NextRequest, NextResponse } from "next/server"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const gtwUrl = process.env.GTW_URL
    const gtwToken = process.env.GTW_TOKEN
    const cmsAccessToken = process.env.CMS_ACCESS_TOKEN
    const { id: productId } = await params

    if (!gtwUrl || !gtwToken || !cmsAccessToken) {
      return NextResponse.json(
        { error: "Payment gateway configuration missing" },
        { status: 500 }
      )
    }

    // Primeiro, buscar os dados atuais do produto via GraphQL para preservá-los
    let currentProduct: any = null
    
    try {
      const graphqlQuery = {
        query: `
          query GetProduct($id: UUID!) {
            productDetails(id: $id) {
              id
              title
              description
              image
              discount
              type {
                code
              }
              metadata
              category {
                id
              }
            }
          }
        `,
        variables: { id: productId }
      }

      const graphqlResponse = await fetch(`${gtwUrl}/${gtwToken}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cmsAccessToken}`,
        },
        body: JSON.stringify(graphqlQuery),
      })

      const graphqlData = await graphqlResponse.json()
      
      if (graphqlData.data?.productDetails) {
        currentProduct = graphqlData.data.productDetails
      }
    } catch (graphqlError) {
      console.warn("Failed to fetch product via GraphQL, using defaults:", graphqlError)
      // Continuar mesmo se falhar - o backend vai preservar os campos
    }

    // Obter FormData da requisição
    const formData = await request.formData()

    // Criar objeto product com os dados atuais (preservando tudo exceto a imagem que será atualizada)
    // Se não conseguir buscar os dados via GraphQL, usar valores mínimos
    const productJson = JSON.stringify({
      title: currentProduct?.title || "Product",
      description: currentProduct?.description || null,
      type: currentProduct?.type || { code: "TICKET" },
      metadata: currentProduct?.metadata || null,
      categoryId: currentProduct?.category?.id || null,
      discount: currentProduct?.discount || null,
    })

    formData.set("product", productJson)

    // Fazer proxy para o backend Java
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
      return NextResponse.json(
        { error: `Failed to update product image: ${response.statusText}` },
        { status: response.status }
      )
    }

    if (!response.ok) {
      return NextResponse.json(
        { 
          error: data.error || data.message || "Failed to update product image",
          details: data
        },
        { status: response.status }
      )
    }

    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error("Product image update API error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

