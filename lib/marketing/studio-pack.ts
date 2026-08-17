import type { MarketingProposal } from "@/lib/graphql/marketing/types"

export type MarketingIntent = "desk" | "campaign" | "banner"

export type StudioChatLine = { role: "user" | "assistant"; content: string }

export type StudioPack = {
  proposal: MarketingProposal | null
  imagePrompt: string
  imageUrl: string | null
}

const MAIN_TYPES: Record<MarketingIntent, string[]> = {
  banner: ["banner", "banner_update"],
  campaign: ["campaign"],
  desk: ["social_pack", "weekly_offer"],
}

const IMAGE_FORMAT: Record<MarketingIntent, string> = {
  banner: "banner",
  campaign: "feed",
  desk: "feed",
}

export const THREAD_TITLES: Record<MarketingIntent, string> = {
  banner: "Banner",
  campaign: "Campanha",
  desk: "Hoje",
}

function stamp(p: MarketingProposal) {
  const t = Date.parse(p.createdAt ?? "")
  return Number.isFinite(t) ? t : 0
}

function newest(rows: MarketingProposal[]) {
  return [...rows].sort((a, b) => stamp(b) - stamp(a))[0] ?? null
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

export function buildStudioPack(
  proposals: MarketingProposal[],
  intent: MarketingIntent,
): StudioPack {
  const pending = proposals.filter((p) => p.status === "pending")
  const proposal = newest(pending.filter((p) => MAIN_TYPES[intent].includes(p.type)))
  const format = IMAGE_FORMAT[intent]
  const imageProposal = newest(
    pending.filter((p) => {
      if (p.type !== "image_prompt") return false
      const rowFormat = asString(p.payload.format) || "feed"
      return rowFormat === format
    }),
  )
  const fromUrls = Array.isArray(proposal?.payload.imageUrls)
    ? asString(proposal.payload.imageUrls[0])
    : ""
  const imageUrl = asString(proposal?.payload.imageUrl) || fromUrls || null
  const imagePrompt = asString(proposal?.payload.imagePrompt) || asString(imageProposal?.payload.prompt)
  return { proposal, imagePrompt, imageUrl }
}

export function chatFromMessages(
  messages: Array<{ role?: string; content?: string }>,
): StudioChatLine[] {
  return messages
    .filter(
      (m): m is StudioChatLine =>
        (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && !!m.content.trim(),
    )
    .map((m) => ({ role: m.role, content: m.content }))
}

export function threadStorageKey(intent: MarketingIntent) {
  return `marketing:thread:${intent}`
}

export function imageFormatForIntent(intent: MarketingIntent) {
  return IMAGE_FORMAT[intent]
}
