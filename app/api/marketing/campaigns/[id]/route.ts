import { NextResponse } from "next/server"
import { requireModuleWriteSession } from "@/lib/auth/requireRole"
import { setMarketingCampaignStatus, updateMarketingCampaign } from "@/lib/actions/marketing"
import type { MarketingCampaignInput } from "@/lib/graphql/marketing/types"

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { error } = await requireModuleWriteSession("marketing")
    if (error) return error

    const { id } = await context.params
    const body = (await request.json().catch(() => null)) as MarketingCampaignInput | null
    if (!body) {
      return NextResponse.json({ error: "Dados em falta" }, { status: 400 })
    }

    const campaign = await updateMarketingCampaign(id, body)
    return NextResponse.json({ campaign })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha ao actualizar a campanha"
    return NextResponse.json({ error: message }, { status: 500 })
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
    const body = (await request.json().catch(() => null)) as { status?: string } | null
    if (!body?.status?.trim()) {
      return NextResponse.json({ error: "Estado em falta" }, { status: 400 })
    }

    const campaign = await setMarketingCampaignStatus(id, body.status)
    return NextResponse.json({ campaign })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha ao alterar o estado"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
