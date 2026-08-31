import "server-only"

import { runGraphQL } from "./graphql"
import { COMMERCIAL_RECOVERY_LEADS } from "@/lib/graphql/commercial-leads/queries"
import type {
  CommercialLeadFilterRequest,
  CommercialLeadPageRequest,
  CommercialRecoveryLeadPage,
  CommercialRecoveryLeadsResponse,
} from "@/lib/graphql/commercial-leads/types"

export interface GetCommercialRecoveryLeadsParams {
  page?: CommercialLeadPageRequest
  filter?: CommercialLeadFilterRequest
}

const DEFAULT_PAGE: CommercialLeadPageRequest = {
  page: 0,
  size: 50,
  sortBy: "lastAttemptAt",
  sortDirection: "DESC",
}

const DEFAULT_FILTER: CommercialLeadFilterRequest = {
  search: null,
  followUpStatus: null,
  dateFrom: null,
  dateTo: null,
  dueOnly: null,
}

export type GetCommercialRecoveryLeadsResult =
  | { ok: true; data: CommercialRecoveryLeadPage }
  | { ok: false; error: string }

export async function getCommercialRecoveryLeads(
  params: GetCommercialRecoveryLeadsParams = {}
): Promise<GetCommercialRecoveryLeadsResult> {
  const page = { ...DEFAULT_PAGE, ...params.page }
  const filter = { ...DEFAULT_FILTER, ...params.filter }

  const result = await runGraphQL<CommercialRecoveryLeadsResponse>(
    COMMERCIAL_RECOVERY_LEADS,
    {
      page: {
        page: page.page ?? 0,
        size: page.size ?? 50,
        sortBy: page.sortBy ?? "lastAttemptAt",
        sortDirection: page.sortDirection ?? "DESC",
      },
      filter: {
        search: filter.search ?? null,
        followUpStatus: filter.followUpStatus ?? null,
        dateFrom: filter.dateFrom ?? null,
        dateTo: filter.dateTo ?? null,
        dueOnly: filter.dueOnly ?? null,
      },
    }
  )

  if (result.errors?.length) {
    return { ok: false, error: result.errors.map((e) => e.message).join("; ") }
  }

  const node = result.data?.commercialRecoveryLeads
  if (!node) {
    return {
      ok: true,
      data: {
        data: [],
        pageNumber: page.page ?? 0,
        pageSize: page.size ?? 50,
        totalElements: 0,
        totalPages: 0,
        metrics: {
          totalActive: 0,
          newCount: 0,
          contactedCount: 0,
          noAnswerCount: 0,
          overdueCount: 0,
          potentialAmount: 0,
          currency: "CVE",
        },
      },
    }
  }

  return {
    ok: true,
    data: {
      data: Array.isArray(node.data) ? node.data : [],
      pageNumber: node.pageNumber ?? 0,
      pageSize: node.pageSize ?? 50,
      totalElements: node.totalElements ?? 0,
      totalPages: node.totalPages ?? 0,
      metrics: {
        totalActive: node.metrics?.totalActive ?? 0,
        newCount: node.metrics?.newCount ?? 0,
        contactedCount: node.metrics?.contactedCount ?? 0,
        noAnswerCount: node.metrics?.noAnswerCount ?? 0,
        overdueCount: node.metrics?.overdueCount ?? 0,
        potentialAmount: node.metrics?.potentialAmount ?? 0,
        currency: node.metrics?.currency ?? "CVE",
      },
    },
  }
}
