import { NextResponse } from "next/server"
import { requireModuleWriteSession } from "@/lib/auth/requireRole"
import { createMarketingCampaign } from "@/lib/actions/marketing"
import type { MarketingCampaignInput } from "@/lib/graphql/marketing/types"

export async function POST(request: Request) {
  try {
    const { error } = await requireModuleWriteSession("marketing")
    if (error) return error

    const body = (await request.json().catch(() => null)) as MarketingCampaignInput | null
    if (!body?.name?.trim()) {
      return NextResponse.json({ error: "A campanha precisa de um nome" }, { status: 400 })
    }

    const campaign = await createMarketingCampaign(body)
    return NextResponse.json({ campaign })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha ao criar a campanha"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
