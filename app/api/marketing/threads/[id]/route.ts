import { NextResponse } from "next/server"
import { requireModuleWriteSession } from "@/lib/auth/requireRole"
import { getMarketingThread } from "@/lib/actions/marketing"
import { buildStudioPack, chatFromMessages, type MarketingIntent } from "@/lib/marketing/studio-pack"

function asIntent(value: string | null): MarketingIntent {
  if (value === "campaign" || value === "banner") return value
  return "desk"
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { error } = await requireModuleWriteSession("marketing")
    if (error) return error

    const { id } = await context.params
    const intent = asIntent(new URL(request.url).searchParams.get("intent"))
    const thread = await getMarketingThread(id)
    if (!thread) {
      return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 })
    }

    return NextResponse.json({
      threadId: id,
      messages: chatFromMessages(thread.messages),
      proposals: thread.proposals,
      pack: buildStudioPack(thread.proposals, intent),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha a ler a conversa"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
