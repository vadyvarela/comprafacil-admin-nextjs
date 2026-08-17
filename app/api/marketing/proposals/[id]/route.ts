import { NextResponse } from "next/server"
import { requireModuleWriteSession } from "@/lib/auth/requireRole"
import { runGraphQL } from "@/lib/actions/graphql"
import { MARKETING_PROPOSALS } from "@/lib/graphql/marketing/queries"
import {
  applyMarketingProposal,
  markProposalApplied,
  markProposalRejected,
} from "@/lib/marketing/apply-proposal"
import type { MarketingProposal } from "@/lib/graphql/marketing/types"

function parseProposal(row: Record<string, unknown>): MarketingProposal {
  let payload: unknown = row.payload
  if (typeof payload === "string") {
    try {
      payload = JSON.parse(payload)
    } catch {
      payload = {}
    }
  }
  return {
    id: String(row.id),
    threadId: (row.threadId as string | null) ?? null,
    campaignId: (row.campaignId as string | null) ?? null,
    type: String(row.type ?? ""),
    title: String(row.title ?? ""),
    payload:
      payload && typeof payload === "object" && !Array.isArray(payload)
        ? (payload as Record<string, unknown>)
        : {},
    status: String(row.status ?? "pending"),
    appliedAt: (row.appliedAt as string | null) ?? null,
    appliedNote: (row.appliedNote as string | null) ?? null,
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { error } = await requireModuleWriteSession("marketing")
    if (error) return error

    const { id } = await context.params
    const body = (await request.json().catch(() => ({}))) as { action?: string }
    const action = body.action === "reject" ? "reject" : "apply"

    const listed = await runGraphQL<{ marketingProposals: Record<string, unknown>[] }>(
      MARKETING_PROPOSALS,
      { status: "pending" },
    )
    if (listed.errors?.length) {
      return NextResponse.json(
        { error: listed.errors[0]?.message ?? "Não foi possível ler as propostas" },
        { status: 502 },
      )
    }
    const row = (listed.data?.marketingProposals ?? []).find((item) => item.id === id)
    if (!row) {
      return NextResponse.json({ error: "Proposta não encontrada" }, { status: 404 })
    }
    const proposal = parseProposal(row)
    if (proposal.status !== "pending") {
      return NextResponse.json({ error: "Esta proposta já foi tratada" }, { status: 409 })
    }

    if (action === "reject") {
      await markProposalRejected(id)
      return NextResponse.json({ ok: true, status: "rejected" })
    }

    const result = await applyMarketingProposal(proposal)
    await markProposalApplied(id, result.note, result.campaignId)
    return NextResponse.json({
      ok: true,
      status: "applied",
      note: result.note,
      campaignId: result.campaignId ?? null,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha ao aplicar"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
