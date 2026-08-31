"use server"

import { requireModuleWriteOrThrow } from "@/lib/auth/requireRole"
import { UPSERT_COMMERCIAL_LEAD_FOLLOW_UP } from "@/lib/graphql/commercial-leads/mutations"
import type {
  CommercialLeadFollowUp,
  UpsertCommercialLeadFollowUpInput,
  UpsertCommercialLeadFollowUpResponse,
} from "@/lib/graphql/commercial-leads/types"
import { runGraphQL } from "./graphql"

export type UpsertCommercialLeadFollowUpResult =
  | { ok: true; data: CommercialLeadFollowUp }
  | { ok: false; error: string }

export async function upsertCommercialLeadFollowUp(
  input: UpsertCommercialLeadFollowUpInput
): Promise<UpsertCommercialLeadFollowUpResult> {
  try {
    await requireModuleWriteOrThrow("marketingLeads")
  } catch {
    return { ok: false, error: "Permissão de gestor necessária." }
  }

  const result = await runGraphQL<UpsertCommercialLeadFollowUpResponse>(
    UPSERT_COMMERCIAL_LEAD_FOLLOW_UP,
    { input }
  )

  if (result.errors?.length) {
    return { ok: false, error: result.errors.map((e) => e.message).join("; ") }
  }

  const data = result.data?.upsertCommercialLeadFollowUp
  if (!data) {
    return { ok: false, error: "Resposta inválida do servidor." }
  }

  return { ok: true, data }
}
