import "server-only"
import { runGraphQL } from "./graphql"
import {
  CUSTOMER_DETAILS,
  CUSTOMER_DETAILS_BY_EXTERNAL_ID,
} from "@/lib/graphql/customers/queries"
import type { CustomerDetailsResponse } from "@/lib/graphql/customers/types"

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
