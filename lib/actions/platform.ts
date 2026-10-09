"use server"

import { can, getPrincipal } from "@/lib/auth/principal"
import { runGraphQL } from "./graphql"
import {
  PLATFORM_EVENTS,
  PLATFORM_REVENUE,
  PLATFORM_TRANSACTIONS,
} from "@/lib/graphql/platform/queries"
import type {
  Page,
  PageInput,
  PlatformEvent,
  PlatformRevenueSummary,
  PlatformTransaction,
} from "@/lib/graphql/platform/types"

/**
 * Área da plataforma. Tudo vai com o token de quem está autenticado: é a API
 * que confirma que é `platformAdmin`, não só este `can()`.
 */

type Result<T> = { ok: true; data: T } | { ok: false; error: string }

type DateRange = { dateFrom?: string | null; dateTo?: string | null }

function errorOf(errors: { message: string }[]): string {
  return errors.map((e) => e.message).join("; ")
}

export async function getPlatformRevenue(
  filter: DateRange = {}
): Promise<Result<PlatformRevenueSummary>> {
  if (!can(await getPrincipal(), "platform.revenue.read")) {
    return { ok: false, error: "Sem permissão." }
  }
  const result = await runGraphQL<{ platformRevenue: PlatformRevenueSummary }>(
    PLATFORM_REVENUE,
    { filter },
    { asUser: true }
  )
  if (result.errors?.length) return { ok: false, error: errorOf(result.errors) }
  if (!result.data?.platformRevenue) return { ok: false, error: "Resposta inválida do servidor." }
  return { ok: true, data: result.data.platformRevenue }
}

export async function getPlatformTransactions(params: {
  filter?: DateRange & { status?: string | null; search?: string | null }
  page: PageInput
}): Promise<Result<Page<PlatformTransaction>>> {
  if (!can(await getPrincipal(), "platform.revenue.read")) {
    return { ok: false, error: "Sem permissão." }
  }
  const result = await runGraphQL<{ platformTransactions: Page<PlatformTransaction> }>(
    PLATFORM_TRANSACTIONS,
    { filter: params.filter ?? null, page: params.page },
    { asUser: true }
  )
  if (result.errors?.length) return { ok: false, error: errorOf(result.errors) }
  if (!result.data?.platformTransactions) return { ok: false, error: "Resposta inválida do servidor." }
  return { ok: true, data: result.data.platformTransactions }
}

export async function getPlatformEvents(params: {
  filter?: DateRange & { level?: string | null; kind?: string | null; search?: string | null }
  page: PageInput
}): Promise<Result<Page<PlatformEvent>>> {
  if (!can(await getPrincipal(), "platform.events.read")) {
    return { ok: false, error: "Sem permissão." }
  }
  const result = await runGraphQL<{ platformEvents: Page<PlatformEvent> }>(
    PLATFORM_EVENTS,
    { filter: params.filter ?? null, page: params.page },
    { asUser: true }
  )
  if (result.errors?.length) return { ok: false, error: errorOf(result.errors) }
  if (!result.data?.platformEvents) return { ok: false, error: "Resposta inválida do servidor." }
  return { ok: true, data: result.data.platformEvents }
}
