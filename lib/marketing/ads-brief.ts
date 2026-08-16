import type { MarketingCampaign } from "@/lib/graphql/marketing/types"
import { resolveCampaignDestinationPath, storefrontCampaignUrl } from "@/lib/marketing/storefront"

export type AdsChannel = "facebook" | "instagram"

export type MarketingAdsBrief = {
  campaignName: string
  destinationUrl: string
  facebookUrl: string
  instagramUrl: string
  headline: string
  facebookPost: string
  instagramCaption: string
  imageUrls: string[]
  formats: { id: string; label: string; size: string }[]
  pixelReady: boolean
  metaPixelId: string | null
  checklist: string[]
}

function slugifyUtm(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60) || "campanha"
}

export function buildAdsDestinationUrl(
  campaign: Pick<MarketingCampaign, "name" | "destinationType" | "destinationHref" | "slug"> | null | undefined,
  channel: AdsChannel,
): string {
  const base = storefrontCampaignUrl(campaign)
  const path = resolveCampaignDestinationPath(campaign)
  const originMatch = base.match(/^(https?:\/\/[^/]+)/)
  const origin = originMatch?.[1] ?? ""
  const absolute = origin ? `${origin}${path}` : path
  const url = new URL(
    absolute.startsWith("http") ? absolute : `https://example.invalid${path}`,
  )
  url.searchParams.set("utm_source", channel)
  url.searchParams.set("utm_medium", "paid_social")
  url.searchParams.set("utm_campaign", slugifyUtm(campaign?.name || "campanha"))
  url.searchParams.set("utm_content", channel === "facebook" ? "feed" : "stories")
  if (!absolute.startsWith("http")) {
    const q = path.includes("?") ? "&" : "?"
    return `${path}${q}${url.searchParams.toString()}`
  }
  return url.toString()
}

export function buildMarketingAdsBrief(input: {
  campaign: MarketingCampaign | null
  offerHeadline?: string | null
  facebookPost?: string | null
  instagramCaption?: string | null
  imageUrls?: string[]
  metaPixelId?: string | null
}): MarketingAdsBrief {
  const campaign = input.campaign
  const name = campaign?.name || "Campanha"
  const headline = campaign?.headline || input.offerHeadline || name
  const facebookPost = campaign?.facebookPost || input.facebookPost || ""
  const instagramCaption = campaign?.instagramCaption || input.instagramCaption || ""
  const imageUrls = (campaign?.imageUrls?.length ? campaign.imageUrls : input.imageUrls) ?? []
  const pixelId = input.metaPixelId?.trim() || null

  return {
    campaignName: name,
    destinationUrl: storefrontCampaignUrl(campaign),
    facebookUrl: buildAdsDestinationUrl(campaign, "facebook"),
    instagramUrl: buildAdsDestinationUrl(campaign, "instagram"),
    headline,
    facebookPost,
    instagramCaption,
    imageUrls,
    formats: [
      { id: "feed", label: "Feed", size: "1080×1080" },
      { id: "stories", label: "Stories / Reels", size: "1080×1920" },
      { id: "banner", label: "Link / landscape", size: "1200×628" },
    ],
    pixelReady: Boolean(pixelId),
    metaPixelId: pixelId,
    checklist: [
      "Cola o link com UTM no Ads Manager",
      "Usa a imagem Feed ou Stories gerada na secretária",
      "Cola o texto Facebook ou Instagram",
      "Confirma o pixel no Events Manager (PageView / Purchase)",
      "Não publiques daqui — só no Meta Ads Manager",
    ],
  }
}
