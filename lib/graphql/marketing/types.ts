export type MarketingWeeklyOffer = {
  headline: string
  hook?: string | null
  productIds?: string[]
  productLabel?: string | null
  facebookPost?: string | null
  instagramCaption?: string | null
  whatsappText?: string | null
  endsAt?: string | null
}

export type MarketingImageRecord = {
  url: string
  format: string
  prompt: string
  createdAt?: string
}

export type MarketingDesk = {
  id?: string | null
  weeklyOffer: MarketingWeeklyOffer | null
  latestImages: MarketingImageRecord[]
  updatedAt?: string | null
}

export type MarketingThread = {
  id: string
  title: string
  createdAt?: string | null
  updatedAt?: string | null
  messageCount: number
}

export type MarketingMessage = {
  id: string
  threadId: string
  role: "user" | "assistant" | "system" | string
  content: string
  toolCalls?: unknown
  createdAt?: string | null
}

export type MarketingProposalStatus = "pending" | "applied" | "rejected" | string

export type MarketingProposal = {
  id: string
  threadId?: string | null
  campaignId?: string | null
  type: string
  title: string
  payload: Record<string, unknown>
  status: MarketingProposalStatus
  appliedAt?: string | null
  appliedNote?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export type MarketingCampaignStatus = "draft" | "scheduled" | "live" | "ended" | string
export type MarketingCampaignObjective = "sell" | "awareness" | "traffic" | string

export type MarketingCampaignDestination = "campaign" | "product" | "category" | string

export type MarketingCampaign = {
  id: string
  name: string
  objective: MarketingCampaignObjective
  status: MarketingCampaignStatus
  startDate?: string | null
  endDate?: string | null
  channels: string[]
  brief?: string | null
  headline?: string | null
  hook?: string | null
  facebookPost?: string | null
  instagramCaption?: string | null
  whatsappText?: string | null
  productIds: string[]
  bannerIds: string[]
  couponIds: string[]
  imageUrls: string[]
  destinationType: MarketingCampaignDestination
  destinationHref?: string | null
  slug?: string | null
  pageTheme: string
  siteTopEnabled: boolean
  siteTopText?: string | null
  siteTopSubtext?: string | null
  siteTopCtaLabel?: string | null
  siteTopCtaHref?: string | null
  siteTopSecondaryCtaLabel?: string | null
  siteTopSecondaryCtaHref?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export type MarketingCampaignInput = {
  name?: string | null
  objective?: string | null
  status?: string | null
  startDate?: string | null
  endDate?: string | null
  channels?: string[] | null
  brief?: string | null
  headline?: string | null
  hook?: string | null
  facebookPost?: string | null
  instagramCaption?: string | null
  whatsappText?: string | null
  productIds?: string[] | null
  bannerIds?: string[] | null
  couponIds?: string[] | null
  imageUrls?: string[] | null
  destinationType?: string | null
  destinationHref?: string | null
  slug?: string | null
  pageTheme?: string | null
  siteTopEnabled?: boolean | null
  siteTopText?: string | null
  siteTopSubtext?: string | null
  siteTopCtaLabel?: string | null
  siteTopCtaHref?: string | null
  siteTopSecondaryCtaLabel?: string | null
  siteTopSecondaryCtaHref?: string | null
}

export type MarketingPulseProduct = {
  productId: string
  productTitle: string
  totalSold: number
  totalRevenue: number
}

export type MarketingLiveBanner = {
  id: string
  title: string
  position?: string | null
  image?: string | null
  endDate?: string | null
}

export type MarketingPulse = {
  siteName: string
  whatsappNumber: string | null
  revenueThisWeek: number
  revenueLastWeek: number
  ordersThisWeek: number
  ordersLastWeek: number
  topProducts: MarketingPulseProduct[]
  liveBanners: MarketingLiveBanner[]
  desk: MarketingDesk
  proposals: MarketingProposal[]
  liveCampaign: MarketingCampaign | null
  /** URL pública da página de destino (/campanha) para posts e anúncios. */
  campaignUrl: string
  metaPixelId: string | null
}
