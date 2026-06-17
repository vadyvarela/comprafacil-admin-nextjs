import { z } from "zod"

export const productPageContentWidthSchema = z.enum(["7xl", "5xl", "container", "full"])
export type ProductPageContentWidth = z.infer<typeof productPageContentWidthSchema>

export const productPageGalleryThumbnailsSchema = z.enum(["side", "bottom"])
export type ProductPageGalleryThumbnails = z.infer<typeof productPageGalleryThumbnailsSchema>

export const productPageLayoutSchema = z.object({
  contentWidth: productPageContentWidthSchema,
  galleryThumbnails: productPageGalleryThumbnailsSchema,
})

export type ProductPageLayout = z.infer<typeof productPageLayoutSchema>

export const DEFAULT_PRODUCT_PAGE_LAYOUT: ProductPageLayout = {
  contentWidth: "7xl",
  galleryThumbnails: "side",
}

export function parseProductPageLayout(raw: string | null | undefined): ProductPageLayout {
  if (!raw?.trim()) return DEFAULT_PRODUCT_PAGE_LAYOUT
  try {
    const parsed = JSON.parse(raw) as unknown
    const result = productPageLayoutSchema.safeParse(parsed)
    if (result.success) return result.data
  } catch {
    /* fall through */
  }
  return DEFAULT_PRODUCT_PAGE_LAYOUT
}

export function serializeProductPageLayout(layout: ProductPageLayout): string {
  return JSON.stringify(layout)
}

export const PRODUCT_PAGE_CONTENT_WIDTH_OPTIONS: Array<{
  value: ProductPageContentWidth
  label: string
}> = [
  { value: "7xl", label: "max-w-7xl (padrão)" },
  { value: "5xl", label: "max-w-5xl" },
  { value: "container", label: "container" },
  { value: "full", label: "Largura total (sem max-width)" },
]

export const PRODUCT_PAGE_GALLERY_THUMBNAIL_OPTIONS: Array<{
  value: ProductPageGalleryThumbnails
  label: string
}> = [
  { value: "side", label: "Ao lado (desktop)" },
  { value: "bottom", label: "Por baixo" },
]
