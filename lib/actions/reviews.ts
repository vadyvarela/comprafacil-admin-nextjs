"use server"

import { revalidatePath } from "next/cache"
import { runGraphQL } from "./graphql"
import { requirePermissionOrThrow } from "@/lib/auth/requirePermission"
import { ADMIN_PRODUCT_REVIEWS, PENDING_PRODUCT_REVIEW_COUNT } from "@/lib/graphql/reviews/queries"
import {
  DELETE_PRODUCT_REVIEW,
  MODERATE_PRODUCT_REVIEW,
  REPLY_PRODUCT_REVIEW,
} from "@/lib/graphql/reviews/mutations"
import type {
  AdminProductReview,
  AdminProductReviewPage,
  ProductReviewFilter,
  ReviewModerationStatus,
} from "@/lib/graphql/reviews/types"

const REVIEW_PAGE_SIZE = 20

type Result<T> = { ok: true; data: T } | { ok: false; error: string }

function errorOf(errors: { message: string }[]): string {
  return errors.map((e) => e.message).join("; ")
}

export async function getProductReviewsPage(
  filter: ProductReviewFilter,
  page: number
): Promise<Result<AdminProductReviewPage>> {
  try {
    await requirePermissionOrThrow("reviews.read")
  } catch {
    return { ok: false, error: "Sem permissão para ver avaliações." }
  }
  const result = await runGraphQL<{ adminProductReviews: AdminProductReviewPage }>(
    ADMIN_PRODUCT_REVIEWS,
    { filter, page: { page, size: REVIEW_PAGE_SIZE } }
  )
  if (result.errors?.length) return { ok: false, error: errorOf(result.errors) }
  const data = result.data?.adminProductReviews
  if (!data) return { ok: false, error: "Resposta inválida do servidor." }
  return { ok: true, data }
}

/** Para o número na sidebar. Falhar aqui não pode partir o layout. */
export async function getPendingProductReviewCount(): Promise<number> {
  try {
    await requirePermissionOrThrow("reviews.read")
    const result = await runGraphQL<{ pendingProductReviewCount: number }>(
      PENDING_PRODUCT_REVIEW_COUNT
    )
    return result.data?.pendingProductReviewCount ?? 0
  } catch {
    return 0
  }
}

async function guardModerate(): Promise<string | null> {
  try {
    await requirePermissionOrThrow("reviews.moderate")
    return null
  } catch {
    return "Sem permissão para moderar avaliações."
  }
}

export async function moderateProductReview(
  id: string,
  moderationStatus: ReviewModerationStatus,
  rejectionReason?: string | null
): Promise<Result<AdminProductReview>> {
  const denied = await guardModerate()
  if (denied) return { ok: false, error: denied }
  // Com o token de quem modera, para a API gravar a pessoa e não o token de serviço.
  const result = await runGraphQL<{ moderateProductReview: AdminProductReview }>(
    MODERATE_PRODUCT_REVIEW,
    { id, moderationStatus, rejectionReason: rejectionReason?.trim() || null },
    { asUser: true }
  )
  if (result.errors?.length) return { ok: false, error: errorOf(result.errors) }
  revalidatePath("/dashboard", "layout")
  const data = result.data?.moderateProductReview
  if (!data) return { ok: false, error: "Resposta inválida do servidor." }
  return { ok: true, data }
}

export async function replyProductReview(
  id: string,
  replyText: string | null
): Promise<Result<AdminProductReview>> {
  const denied = await guardModerate()
  if (denied) return { ok: false, error: denied }
  const result = await runGraphQL<{ replyProductReview: AdminProductReview }>(
    REPLY_PRODUCT_REVIEW,
    { id, replyText: replyText?.trim() || null },
    { asUser: true }
  )
  if (result.errors?.length) return { ok: false, error: errorOf(result.errors) }
  revalidatePath("/dashboard/reviews")
  const data = result.data?.replyProductReview
  if (!data) return { ok: false, error: "Resposta inválida do servidor." }
  return { ok: true, data }
}

export async function deleteProductReview(id: string): Promise<Result<true>> {
  const denied = await guardModerate()
  if (denied) return { ok: false, error: denied }
  const result = await runGraphQL<{ deleteProductReview: boolean }>(
    DELETE_PRODUCT_REVIEW,
    { id },
    { asUser: true }
  )
  if (result.errors?.length) return { ok: false, error: errorOf(result.errors) }
  revalidatePath("/dashboard", "layout")
  return { ok: true, data: true }
}
