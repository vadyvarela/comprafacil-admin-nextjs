import { NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/auth/requireAdmin"
import {
  metadataWithGallery,
  parseProductGalleryUrls,
} from "@/lib/products/product-gallery-metadata"

type ProductDetails = {
  id: string
  title: string
  description?: string | null
  summary?: string | null
  image?: string | null
  discount?: number | null
  condition?: string | null
  type: { code: string }
  metadata?: string | null
  category?: { id: string } | null
  brand?: { id: string } | null
}

async function fetchProduct(
  gtwUrl: string,
  gtwToken: string,
  cmsAccessToken: string,
  productId: string,
): Promise<ProductDetails | null> {
  const graphqlQuery = {
    query: `
      query GetProduct($id: UUID!) {
        productDetails(id: $id) {
          id
          title
          description
          summary
          image
          discount
          condition
          type { code }
          metadata
          category { id }
          brand { id }
        }
      }
    `,
    variables: { id: productId },
  }

  const res = await fetch(`${gtwUrl}/${gtwToken}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cmsAccessToken}`,
    },
    body: JSON.stringify(graphqlQuery),
  })

  const data = await res.json()
  return data?.data?.productDetails ?? null
}

async function updateProductGallery(
  gtwUrl: string,
  gtwToken: string,
  cmsAccessToken: string,
  productId: string,
  product: ProductDetails,
  galleryUrls: string[],
) {
  const metadata = metadataWithGallery(product.metadata, galleryUrls)
  const cover = galleryUrls[0] ?? null

  const mutation = {
    query: `
      mutation UpdateProductGallery($id: UUID!, $input: ProductInput!) {
        updateProduct(id: $id, input: $input) {
          id
          image
          metadata
        }
      }
    `,
    variables: {
      id: productId,
      input: {
        title: product.title,
        description: product.description ?? null,
        summary: product.summary ?? null,
        discount: product.discount ?? null,
        condition: product.condition ?? null,
        type: { code: product.type?.code ?? "TICKET" },
        metadata,
        ...(cover ? { image: cover } : { image: "" }),
        categoryId: product.category?.id ?? null,
        brandId: product.brand?.id ?? null,
      },
    },
  }

  const res = await fetch(`${gtwUrl}/${gtwToken}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cmsAccessToken}`,
    },
    body: JSON.stringify(mutation),
  })

  const data = await res.json()
  if (data.errors?.length) {
    throw new Error(data.errors[0]?.message ?? "Erro GraphQL ao guardar galeria")
  }
  return data.data?.updateProduct
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { error } = await requireAdminSession()
    if (error) return error

    const gtwUrl = process.env.GTW_URL
    const gtwToken = process.env.GTW_TOKEN
    const cmsAccessToken = process.env.CMS_ACCESS_TOKEN
    const { id: productId } = await params

    if (!gtwUrl || !gtwToken || !cmsAccessToken) {
      return NextResponse.json(
        { error: "Payment gateway configuration missing" },
        { status: 500 },
      )
    }

    const product = await fetchProduct(gtwUrl, gtwToken, cmsAccessToken, productId)
    if (!product) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
    }

    const images = parseProductGalleryUrls(product.image, product.metadata)
    return NextResponse.json({ images })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { error } = await requireAdminSession()
    if (error) return error

    const gtwUrl = process.env.GTW_URL
    const gtwToken = process.env.GTW_TOKEN
    const cmsAccessToken = process.env.CMS_ACCESS_TOKEN
    const { id: productId } = await params

    if (!gtwUrl || !gtwToken || !cmsAccessToken) {
      return NextResponse.json(
        { error: "Payment gateway configuration missing" },
        { status: 500 },
      )
    }

    const body = (await request.json()) as { images?: unknown }
    if (!Array.isArray(body.images)) {
      return NextResponse.json(
        { error: "Campo «images» deve ser um array de URLs" },
        { status: 400 },
      )
    }

    const galleryUrls = body.images.filter(
      (x): x is string => typeof x === "string" && x.trim().length > 0,
    )

    const product = await fetchProduct(gtwUrl, gtwToken, cmsAccessToken, productId)
    if (!product) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
    }

    const updated = await updateProductGallery(
      gtwUrl,
      gtwToken,
      cmsAccessToken,
      productId,
      product,
      galleryUrls,
    )

    const images = parseProductGalleryUrls(updated?.image, updated?.metadata)
    return NextResponse.json({ images, image: images[0] ?? null })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
