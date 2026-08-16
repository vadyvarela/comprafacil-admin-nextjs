import type { MarketingCampaign } from "@/lib/graphql/marketing/types"

/** Origem pública da loja (techarena) para links de campanha / preview. */
export function getStorefrontOrigin(): string | null {
  const candidates = [
    process.env.NEXT_PUBLIC_TECHARENA_URL,
    process.env.NEXT_PUBLIC_STORE_URL,
    process.env.TECHARENA_REVALIDATE_URL,
  ]
  for (const raw of candidates) {
    const value = raw?.trim()
    if (!value) continue
    try {
      const url = new URL(value.includes("://") ? value : `https://${value}`)
      return `${url.protocol}//${url.host}`
    } catch {
      continue
    }
  }
  return null
}

export function resolveCampaignDestinationPath(
  campaign?: Pick<MarketingCampaign, "destinationType" | "destinationHref" | "slug"> | null,
): string {
  const type = campaign?.destinationType || "campaign"
  const href = campaign?.destinationHref?.trim()
  if (type === "product" && href?.startsWith("/produto/")) return href
  if (type === "category" && href?.startsWith("/categoria/")) return href
  if (type === "campaign") {
    if (href?.startsWith("/campanha")) return href
    const slug = campaign?.slug?.trim()
    if (slug) return `/campanha/${slug}`
    return "/campanha"
  }
  return href?.startsWith("/") ? href : "/campanha"
}

export function storefrontCampaignUrl(
  campaign?: Pick<MarketingCampaign, "destinationType" | "destinationHref" | "slug"> | null,
): string {
  const path = resolveCampaignDestinationPath(campaign)
  const origin = getStorefrontOrigin()
  return origin ? `${origin}${path}` : path
}
