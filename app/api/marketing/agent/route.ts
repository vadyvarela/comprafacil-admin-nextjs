import { NextResponse } from "next/server"
import { requireModuleWriteSession } from "@/lib/auth/requireRole"
import {
  appendMarketingMessage,
  compactPulseText,
  createMarketingProposal,
  createMarketingThread,
  getMarketingPulse,
  getMarketingThread,
  listMarketingCampaigns,
  searchMarketingProducts,
} from "@/lib/actions/marketing"
import { marketingSystemPrompt } from "@/lib/marketing/system-prompt"
import { MARKETING_AGENT_TOOLS } from "@/lib/marketing/tools"
import { runGraphQL } from "@/lib/actions/graphql"
import { GET_BANNERS } from "@/lib/graphql/banners/queries"
import {
  THREAD_TITLES,
  buildStudioPack,
  chatFromMessages,
  type MarketingIntent,
} from "@/lib/marketing/studio-pack"

export const maxDuration = 60

type ChatBody = {
  message?: string
  threadId?: string | null
  intent?: MarketingIntent
}

type OaiMessage = {
  role: string
  content?: string | null
  tool_calls?: Array<{
    id: string
    type: string
    function: { name: string; arguments: string }
  }>
}

function asIntent(value: unknown): MarketingIntent {
  if (value === "campaign" || value === "banner") return value
  return "desk"
}

function llmConfig() {
  const apiKey = process.env.MARKETING_AGENT_API_KEY
  if (!apiKey) {
    return { error: "Falta MARKETING_AGENT_API_KEY no servidor do backoffice." }
  }
  return {
    apiKey,
    model: process.env.MARKETING_AGENT_MODEL?.trim() || "gpt-4o-mini",
    baseUrl: (process.env.MARKETING_AGENT_BASE_URL?.replace(/\/$/, "") || "https://api.openai.com/v1"),
  }
}

async function chatCompletions(
  cfg: { apiKey: string; model: string; baseUrl: string },
  messages: OaiMessage[],
) {
  const response = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: cfg.model,
      messages,
      tools: MARKETING_AGENT_TOOLS,
      tool_choice: "auto",
      temperature: 0.4,
    }),
    signal: AbortSignal.timeout(45000),
  })
  const json = (await response.json()) as {
    error?: { message?: string }
    choices?: Array<{ message: OaiMessage; finish_reason?: string }>
  }
  if (!response.ok) {
    throw new Error(json.error?.message || `LLM ${response.status}`)
  }
  const message = json.choices?.[0]?.message
  if (!message) throw new Error("Resposta vazia do modelo")
  return message
}

function historyForLlm(
  stored: Array<{ role: string; content: string }>,
  current: string,
): OaiMessage[] {
  const prior = chatFromMessages(stored)
  const last = prior[prior.length - 1]
  const trimmed =
    last?.role === "user" && last.content.trim() === current.trim() ? prior.slice(0, -1) : prior
  return [...trimmed.slice(-16), { role: "user", content: current }]
}

async function executeTool(
  name: string,
  args: Record<string, unknown>,
  threadId: string,
): Promise<string> {
  if (name === "search_products") {
    const query = String(args.query ?? "")
    const products = await searchMarketingProducts(query, 8)
    return JSON.stringify(
      products.map((p) => ({
        id: p.id,
        title: p.title,
        image: p.image ?? null,
        discount: p.discount ?? 0,
      })),
    )
  }

  if (name === "list_banners") {
    const banners = await runGraphQL<{
      banners: Array<{
        id: string
        title: string
        subtitle?: string | null
        buttonText?: string | null
        link?: string | null
        image?: string | null
        position?: string | null
        orderIndex?: number | null
        startDate?: string | null
        endDate?: string | null
        status?: { code?: string }
      }>
    }>(GET_BANNERS)
    return JSON.stringify(
      (banners.data?.banners ?? []).slice(0, 20).map((b) => ({
        id: b.id,
        title: b.title,
        subtitle: b.subtitle,
        buttonText: b.buttonText,
        link: b.link,
        image: b.image,
        position: b.position,
        orderIndex: b.orderIndex,
        startDate: b.startDate,
        endDate: b.endDate,
        status: b.status?.code,
      })),
    )
  }

  if (name === "list_campaigns") {
    const campaigns = await listMarketingCampaigns()
    const status = typeof args.status === "string" ? args.status.trim() : ""
    const rows = status ? campaigns.filter((c) => c.status === status) : campaigns
    return JSON.stringify(
      rows.slice(0, 20).map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        objective: c.objective,
        startDate: c.startDate,
        endDate: c.endDate,
        channels: c.channels,
        destinationType: c.destinationType,
        destinationHref: c.destinationHref,
        slug: c.slug,
        pageTheme: c.pageTheme,
        siteTopEnabled: c.siteTopEnabled,
        headline: c.headline,
      })),
    )
  }

  const typeMap: Record<string, string> = {
    propose_campaign: "campaign",
    attach_to_campaign: "campaign_attach",
    propose_weekly_offer: "weekly_offer",
    propose_social_pack: "social_pack",
    propose_banner: "banner",
    propose_banner_update: "banner_update",
    propose_coupon: "coupon",
    propose_product_merch: "product_merch",
    propose_image_prompt: "image_prompt",
  }
  const type = typeMap[name]
  if (!type) return JSON.stringify({ error: `ferramenta desconhecida: ${name}` })

  const title =
    String(
      args.headline ??
        args.name ??
        args.title ??
        args.prompt ??
        (type === "banner_update" ? "Actualizar banner" : "Proposta"),
    ).slice(0, 240)
  const campaignId = typeof args.campaignId === "string" ? args.campaignId : null

  const proposal = await createMarketingProposal({
    type,
    title,
    payload: args,
    threadId,
    campaignId,
  })
  return JSON.stringify({ ok: true, proposalId: proposal.id, type, title, campaignId: proposal.campaignId })
}

export async function POST(request: Request) {
  try {
    const { error } = await requireModuleWriteSession("marketing")
    if (error) return error

    const cfg = llmConfig()
    if ("error" in cfg) {
      return NextResponse.json({ error: cfg.error }, { status: 503 })
    }

    const body = (await request.json().catch(() => null)) as ChatBody | null
    const message = body?.message?.trim()
    if (!message) {
      return NextResponse.json({ error: "Escreve uma instrução." }, { status: 400 })
    }

    const intent = asIntent(body?.intent)
    const pulse = await getMarketingPulse()
    let threadId = body?.threadId?.trim() || ""
    if (!threadId) {
      const thread = await createMarketingThread(`${THREAD_TITLES[intent]} · ${message.slice(0, 60)}`)
      threadId = thread.id
    }

    await appendMarketingMessage({ threadId, role: "user", content: message })
    const before = await getMarketingThread(threadId)
    const history = historyForLlm(before?.messages ?? [], message)

    const messages: OaiMessage[] = [
      {
        role: "system",
        content: marketingSystemPrompt({
          siteName: pulse.siteName,
          compactContext: compactPulseText(pulse),
          intent,
        }),
      },
      ...history,
    ]

    let assistantText = ""
    for (let step = 0; step < 6; step += 1) {
      const reply = await chatCompletions(cfg, messages)
      if (reply.tool_calls?.length) {
        messages.push(reply)
        for (const call of reply.tool_calls) {
          let args: Record<string, unknown> = {}
          try {
            args = JSON.parse(call.function.arguments || "{}") as Record<string, unknown>
          } catch {
            args = {}
          }
          const toolResult = await executeTool(call.function.name, args, threadId)
          messages.push({
            role: "tool",
            content: toolResult,
            tool_call_id: call.id,
          } as OaiMessage & { tool_call_id: string })
        }
        continue
      }
      assistantText = (reply.content || "").trim()
      break
    }

    if (!assistantText) {
      assistantText = "Pack actualizado à direita."
    }

    await appendMarketingMessage({ threadId, role: "assistant", content: assistantText })

    const [refreshed, thread] = await Promise.all([getMarketingPulse(), getMarketingThread(threadId)])
    const proposals = thread?.proposals ?? []
    return NextResponse.json({
      threadId,
      reply: assistantText,
      messages: chatFromMessages(thread?.messages ?? []),
      proposals,
      pack: buildStudioPack(proposals, intent),
      desk: refreshed.desk,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha no agente"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
