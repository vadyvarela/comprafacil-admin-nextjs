import "server-only"
import { runGraphQL } from "./graphql"
import {
  CUSTOMERS_SEARCH,
  CUSTOMER_DETAILS,
  CUSTOMER_DETAILS_BY_EXTERNAL_ID,
} from "@/lib/graphql/customers/queries"
import type {
  CustomerDetailsResponse,
  CustomerPageResponse,
} from "@/lib/graphql/customers/types"

export const CUSTOMER_PAGE_SIZE = 20

export interface GetCustomersParams {
  search?: string | null
  page?: number
}

export type GetCustomersResult =
  | { ok: true; data: CustomerPageResponse }
  | { ok: false; error: string }

export async function getCustomers(
  params: GetCustomersParams = {}
): Promise<GetCustomersResult> {
  const search = params.search?.trim() ?? null
  const page = Math.max(0, params.page ?? 0)

  const result = await runGraphQL<{ customers: CustomerPageResponse }>(
    CUSTOMERS_SEARCH,
    {
      filter: {
        search: search || null,
      },
      page: {
        page,
        size: CUSTOMER_PAGE_SIZE,
        sortBy: "createdAt",
        sortDirection: "DESC",
      },
    }
  )

  if (result.errors?.length) {
    return { ok: false, error: result.errors.map((e) => e.message).join("; ") }
  }

  const customers = result.data?.customers
  if (!customers) {
    return {
      ok: true,
      data: {
        data: [],
        pageNumber: 0,
        pageSize: CUSTOMER_PAGE_SIZE,
        totalElements: 0,
        totalPages: 0,
      },
    }
  }

  return { ok: true, data: customers }
}

export type GetCustomerDetailsResult =
  | { ok: true; data: CustomerDetailsResponse }
  | { ok: false; error: string; notFound?: boolean }

export async function getCustomerDetails(
  customerId: string
): Promise<GetCustomerDetailsResult> {
  const result = await runGraphQL<{
    customerDetails: CustomerDetailsResponse | null
  }>(CUSTOMER_DETAILS, { id: customerId })

  if (result.errors?.length) {
    return { ok: false, error: result.errors.map((e) => e.message).join("; ") }
  }

  const customer = result.data?.customerDetails
  if (!customer) {
    return { ok: false, error: "Cliente não encontrado", notFound: true }
  }

  return { ok: true, data: customer }
}

export async function getCustomerDetailsByExternalId(
  customerExternalId: string
): Promise<GetCustomerDetailsResult> {
  const result = await runGraphQL<{
    customerDetailsByExternalId: CustomerDetailsResponse | null
  }>(CUSTOMER_DETAILS_BY_EXTERNAL_ID, {
    customerExternalId,
  })

  if (result.errors?.length) {
    return { ok: false, error: result.errors.map((e) => e.message).join("; ") }
  }

  const customer = result.data?.customerDetailsByExternalId
  if (!customer) {
    return { ok: false, error: "Cliente não encontrado", notFound: true }
  }

  return { ok: true, data: customer }
}
