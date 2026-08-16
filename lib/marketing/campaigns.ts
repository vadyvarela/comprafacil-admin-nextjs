import { format, parseISO } from "date-fns"
import { pt } from "date-fns/locale"
import type {
  MarketingCampaign,
  MarketingCampaignObjective,
  MarketingCampaignStatus,
} from "@/lib/graphql/marketing/types"

export const CAMPAIGN_CHANNELS = [
  { id: "store", label: "Loja" },
  { id: "facebook", label: "Facebook" },
  { id: "instagram", label: "Instagram" },
  { id: "whatsapp", label: "WhatsApp" },
] as const

export const CAMPAIGN_OBJECTIVES: { id: MarketingCampaignObjective; label: string }[] = [
  { id: "sell", label: "Vender" },
  { id: "awareness", label: "Notoriedade" },
  { id: "traffic", label: "Tráfego" },
]

export const CAMPAIGN_DESTINATIONS = [
  { id: "campaign", label: "Página campanha", hint: "/campanha ou /campanha/slug" },
  { id: "product", label: "Produto", hint: "/produto/slug" },
  { id: "category", label: "Categoria", hint: "/categoria/slug" },
] as const

export const CAMPAIGN_PAGE_THEMES = [
  { id: "default", label: "Normal" },
  { id: "black-friday", label: "Black Friday" },
  { id: "carnival", label: "Carnaval" },
  { id: "seasonal", label: "Sazonal" },
] as const

export function campaignPageThemeLabel(theme: string) {
  return CAMPAIGN_PAGE_THEMES.find((item) => item.id === theme)?.label ?? theme
}

export function slugifyCampaign(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}

export const CAMPAIGN_STATUSES: { id: MarketingCampaignStatus; label: string }[] = [
  { id: "live", label: "Live" },
  { id: "scheduled", label: "Agendada" },
  { id: "draft", label: "Rascunho" },
  { id: "ended", label: "Encerrada" },
]

export function campaignDestinationLabel(type: string) {
  return CAMPAIGN_DESTINATIONS.find((item) => item.id === type)?.label ?? type
}

export function campaignStatusLabel(status: string) {
  return CAMPAIGN_STATUSES.find((item) => item.id === status)?.label ?? status
}

export function campaignObjectiveLabel(objective: string) {
  return CAMPAIGN_OBJECTIVES.find((item) => item.id === objective)?.label ?? objective
}

export function campaignChannelLabel(channel: string) {
  return CAMPAIGN_CHANNELS.find((item) => item.id === channel)?.label ?? channel
}

export function campaignStatusClass(status: string) {
  switch (status) {
    case "live":
      return "bg-emerald-50 text-emerald-800 border-emerald-200"
    case "scheduled":
      return "bg-sky-50 text-sky-800 border-sky-200"
    case "ended":
      return "bg-zinc-100 text-zinc-600 border-zinc-200"
    default:
      return "bg-muted text-muted-foreground border-border"
  }
}

export function campaignDotClass(status: string) {
  switch (status) {
    case "live":
      return "bg-emerald-600"
    case "scheduled":
      return "bg-sky-600"
    case "ended":
      return "bg-zinc-300"
    default:
      return "bg-zinc-400"
  }
}

export function campaignDayKey(value?: string | null) {
  const match = value?.trim().match(/^(\d{4}-\d{2}-\d{2})/)
  return match?.[1] ?? null
}

export function toCampaignGraphQLDate(
  value: string | null | undefined,
  boundary: "start" | "end",
): string | null {
  if (value == null || !String(value).trim()) return null
  const day = campaignDayKey(value)
  if (!day) return null
  return boundary === "start" ? `${day}T00:00:00` : `${day}T23:59:59`
}

export function parseCampaignDate(value?: string | null) {
  const day = campaignDayKey(value)
  if (!day) return null
  const parsed = parseISO(`${day}T12:00:00`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function formatCampaignDay(value?: string | null) {
  const date = parseCampaignDate(value)
  if (!date) return "—"
  return format(date, "d MMM", { locale: pt })
}

export function formatCampaignRange(campaign: Pick<MarketingCampaign, "startDate" | "endDate">) {
  if (!campaign.startDate && !campaign.endDate) return "Sem datas"
  return `${formatCampaignDay(campaign.startDate)} – ${formatCampaignDay(campaign.endDate)}`
}

export function toDateInputValue(value?: string | null) {
  return campaignDayKey(value) ?? ""
}

export function campaignCoversDay(
  campaign: Pick<MarketingCampaign, "startDate" | "endDate">,
  day: Date,
) {
  const key = format(day, "yyyy-MM-dd")
  const from = campaignDayKey(campaign.startDate)
  const to = campaignDayKey(campaign.endDate)
  if (!from && !to) return false
  return key >= (from ?? key) && key <= (to ?? key)
}
