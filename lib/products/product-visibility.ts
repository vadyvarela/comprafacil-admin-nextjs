/** Product store visibility: ACTIVE = published, INACTIVE = draft. */

export const PRODUCT_STATUS_PUBLISHED = "ACTIVE"
export const PRODUCT_STATUS_DRAFT = "INACTIVE"

export function isProductDraft(statusCode?: string | null): boolean {
  return (statusCode ?? PRODUCT_STATUS_PUBLISHED).toUpperCase() === PRODUCT_STATUS_DRAFT
}

export function productVisibilityLabel(statusCode?: string | null): string {
  return isProductDraft(statusCode) ? "Rascunho" : "Publicado"
}

export function productVisibilityToggleCode(statusCode?: string | null): string {
  return isProductDraft(statusCode) ? PRODUCT_STATUS_PUBLISHED : PRODUCT_STATUS_DRAFT
}

export function productVisibilityToggleLabel(statusCode?: string | null): string {
  return isProductDraft(statusCode) ? "Publicar" : "Despublicar"
}

export function productVisibilityStatusInput(statusCode: string) {
  return { code: statusCode }
}

/** Minimal ProductInput for publish/unpublish via updateProduct. */
export function productVisibilityUpdateInput(
  product: {
    title: string
    type?: { code?: string | null } | null
  },
  nextStatusCode: string,
) {
  return {
    title: product.title,
    type: { code: product.type?.code?.trim() || "TICKET" },
    status: productVisibilityStatusInput(nextStatusCode),
  }
}
