import { Suspense } from "react"
import { MessageSquareText, Search } from "lucide-react"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { EmptyState } from "@/components/admin/empty-state"
import { ReadOnlyNotice } from "@/components/admin/read-only-notice"
import { ReviewListToolbar, type ReviewsTab } from "@/components/reviews/review-list-toolbar"
import { ReviewCard } from "@/components/reviews/review-card"
import { OrderPagination } from "@/components/orders/order-pagination"
import { getProductReviewsPage } from "@/lib/actions/reviews"
import { can, getPrincipal } from "@/lib/auth/principal"
import type { ReviewModerationStatus } from "@/lib/graphql/reviews/types"

type PageProps = {
  searchParams: Promise<{ tab?: string; search?: string; rating?: string; page?: string }>
}

function parseTab(value?: string): ReviewsTab {
  const v = (value ?? "").toUpperCase()
  if (v === "APPROVED" || v === "REJECTED" || v === "ALL") return v
  // A caixa de entrada é o que falta decidir.
  return "PENDING"
}

const EMPTY_COPY: Record<ReviewsTab, { title: string; description: string }> = {
  PENDING: {
    title: "Nada para moderar",
    description: "As avaliações novas aparecem aqui antes de ficarem visíveis na loja.",
  },
  APPROVED: {
    title: "Nenhuma avaliação aprovada",
    description: "As avaliações que aprovar ficam visíveis na página do produto.",
  },
  REJECTED: {
    title: "Nenhuma avaliação rejeitada",
    description: "As avaliações rejeitadas nunca chegam à loja.",
  },
  ALL: {
    title: "Ainda sem avaliações",
    description:
      "Os clientes recebem um email para avaliar quando o pedido passa a Entregue.",
  },
}

export default async function ReviewsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const tab = parseTab(params.tab)
  const search = params.search?.trim() || null
  const ratingNum = Number(params.rating)
  const rating = Number.isInteger(ratingNum) && ratingNum >= 1 && ratingNum <= 5 ? ratingNum : null
  const page = Math.max(0, Math.floor(Number(params.page) || 0))
  const canModerate = can(await getPrincipal(), "reviews.moderate")

  const result = await getProductReviewsPage(
    {
      moderationStatus: tab === "ALL" ? null : (tab as ReviewModerationStatus),
      search,
      rating,
    },
    page
  )
  const reviews = result.ok ? result.data.data : []
  const totalElements = result.ok ? (result.data.totalElements ?? 0) : 0
  const totalPages = result.ok ? (result.data.totalPages ?? 0) : 0
  const pageSize = result.ok ? (result.data.pageSize ?? 20) : 20
  const empty = search || rating
    ? { title: "Nenhum resultado", description: "Tente outro termo ou remova os filtros." }
    : EMPTY_COPY[tab]

  return (
    <>
      <DashboardHeader
        items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Avaliações" }]}
      />
      <div className="flex flex-1 flex-col min-h-0">
        <Suspense fallback={null}>
          <ReviewListToolbar
            totalElements={totalElements}
            currentTab={tab}
            currentRating={rating}
            error={result.ok ? null : result.error}
          />
        </Suspense>
        <div className="flex-1 overflow-auto p-5 pt-4 space-y-3">
          {!canModerate ? (
            <ReadOnlyNotice moduleLabel="Avaliações" />
          ) : null}
          {result.ok && reviews.length === 0 ? (
            <EmptyState
              icon={search || rating ? Search : MessageSquareText}
              title={empty.title}
              description={empty.description}
            />
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} canModerate={canModerate} />
              ))}
            </div>
          )}
          {totalPages > 1 ? (
            <Suspense fallback={null}>
              <OrderPagination
                currentPage={page}
                totalPages={totalPages}
                totalElements={totalElements}
                pageSize={pageSize}
              />
            </Suspense>
          ) : null}
        </div>
      </div>
    </>
  )
}
