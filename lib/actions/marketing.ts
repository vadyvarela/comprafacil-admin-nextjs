import "server-only"
import { subDays } from "date-fns"
import { runGraphQL } from "@/lib/actions/graphql"
import { MARKETING_DESK, MARKETING_PROPOSALS, MARKETING_CAMPAIGNS, MARKETING_CAMPAIGN, MARKETING_LIVE_CAMPAIGN } from "@/lib/graphql/marketing/queries"
import {
  CREATE_MARKETING_PROPOSAL,
  CREATE_MARKETING_THREAD,
  APPEND_MARKETING_MESSAGE,
  SAVE_MARKETING_WEEKLY_OFFER,
  RECORD_MARKETING_IMAGE,
  UPDATE_MARKETING_PROPOSAL_STATUS,
  CREATE_MARKETING_CAMPAIGN,
  UPDATE_MARKETING_CAMPAIGN,
  SET_MARKETING_CAMPAIGN_STATUS,
  ATTACH_MARKETING_CAMPAIGN_ASSETS,
} from "@/lib/graphql/marketing/mutations"
import type {
  MarketingCampaign,
  MarketingCampaignInput,
  MarketingDesk,
  MarketingImageRecord,
  MarketingMessage,
  MarketingProposal,
  MarketingPulse,
  MarketingPulseProduct,
  MarketingThread,
  MarketingWeeklyOffer,
} from "@/lib/graphql/marketing/types"
import { GET_STORE_SETTINGS } from "@/lib/graphql/store-settings/queries"
import { GET_BANNERS } from "@/lib/graphql/banners/queries"
import { ANALYTICS_SALES_SUMMARY, ANALYTICS_PRODUCT_SALES_REPORT } from "@/lib/graphql/analytics/queries"
import { GET_PRODUCTS, GET_PRODUCT } from "@/lib/graphql/products/queries"
import { minorToMajorCurrencyAmount } from "@/lib/utils/currency"
import { toCampaignGraphQLDate } from "@/lib/marketing/campaigns"
import { storefrontCampaignUrl } from "@/lib/marketing/storefront"

function asIso(d: Date) {
  return d.toISOString()
}

function parseOffer(raw: unknown): MarketingWeeklyOffer | null {
  let value: unknown = raw
  if (typeof value === "string") {
    try {
      value = JSON.parse(value)
    } catch {
      return null
    }
  }
  if (!value || typeof value !== "object") return null
  const o = value as Record<string, unknown>
  if (typeof o.headline !== "string" || !o.headline.trim()) return null
  return {
    headline: o.headline,
    hook: typeof o.hook === "string" ? o.hook : null,
    productIds: Array.isArray(o.productIds) ? o.productIds.filter((id): id is string => typeof id === "string") : [],
    productLabel: typeof o.productLabel === "string" ? o.productLabel : null,
    facebookPost: typeof o.facebookPost === "string" ? o.facebookPost : null,
    instagramCaption: typeof o.instagramCaption === "string" ? o.instagramCaption : null,
    whatsappText: typeof o.whatsappText === "string" ? o.whatsappText : null,
    endsAt: typeof o.endsAt === "string" ? o.endsAt : null,
  }
}

function parseImages(raw: unknown): MarketingImageRecord[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item) => ({
      url: String(item.url ?? ""),
      format: String(item.format ?? "feed"),
      prompt: String(item.prompt ?? ""),
      createdAt: typeof item.createdAt === "string" ? item.createdAt : undefined,
    }))
    .filter((item) => item.url)
}

function coerceJsonObject(raw: unknown): Record<string, unknown> {
  let value: unknown = raw
  if (typeof value === "string") {
    try {
      value = JSON.parse(value)
    } catch {
      return {}
    }
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

function parseProposal(row: Record<string, unknown>): MarketingProposal {
  return {
    id: String(row.id),
    threadId: (row.threadId as string | null) ?? null,
    campaignId: (row.campaignId as string | null) ?? null,
    type: String(row.type ?? ""),
    title: String(row.title ?? ""),
    payload: coerceJsonObject(row.payload),
    status: String(row.status ?? "pending"),
    appliedAt: (row.appliedAt as string | null) ?? null,
    appliedNote: (row.appliedNote as string | null) ?? null,
    createdAt: (row.createdAt as string | null) ?? null,
    updatedAt: (row.updatedAt as string | null) ?? null,
  }
}

function asStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((item): item is string => typeof item === "string" && !!item.trim())
}

export function parseMarketingCampaign(row: Record<string, unknown> | null | undefined): MarketingCampaign | null {
  if (!row?.id) return null
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    objective: String(row.objective ?? "sell"),
    status: String(row.status ?? "draft"),
    startDate: (row.startDate as string | null) ?? null,
    endDate: (row.endDate as string | null) ?? null,
    channels: asStringArray(row.channels),
    brief: (row.brief as string | null) ?? null,
    headline: (row.headline as string | null) ?? null,
    hook: (row.hook as string | null) ?? null,
    facebookPost: (row.facebookPost as string | null) ?? null,
    instagramCaption: (row.instagramCaption as string | null) ?? null,
    whatsappText: (row.whatsappText as string | null) ?? null,
    productIds: asStringArray(row.productIds),
    bannerIds: asStringArray(row.bannerIds),
    couponIds: asStringArray(row.couponIds),
    imageUrls: asStringArray(row.imageUrls),
    destinationType: String(row.destinationType ?? "campaign"),
    destinationHref: (row.destinationHref as string | null) ?? null,
    slug: (row.slug as string | null) ?? null,
    pageTheme: String(row.pageTheme ?? "default"),
    siteTopEnabled: Boolean(row.siteTopEnabled),
    siteTopText: (row.siteTopText as string | null) ?? null,
    siteTopSubtext: (row.siteTopSubtext as string | null) ?? null,
    siteTopCtaLabel: (row.siteTopCtaLabel as string | null) ?? null,
    siteTopCtaHref: (row.siteTopCtaHref as string | null) ?? null,
    siteTopSecondaryCtaLabel: (row.siteTopSecondaryCtaLabel as string | null) ?? null,
    siteTopSecondaryCtaHref: (row.siteTopSecondaryCtaHref as string | null) ?? null,
    createdAt: (row.createdAt as string | null) ?? null,
    updatedAt: (row.updatedAt as string | null) ?? null,
  }
}

function campaignInputDates(input: MarketingCampaignInput): MarketingCampaignInput {
  return {
    ...input,
    startDate: input.startDate === undefined ? input.startDate : toCampaignGraphQLDate(input.startDate, "start"),
    endDate: input.endDate === undefined ? input.endDate : toCampaignGraphQLDate(input.endDate, "end"),
  }
}

async function fetchSales(start: Date, end: Date) {
  const result = await runGraphQL<{
    salesSummary: { totalRevenue?: number | null; totalProductSold?: number | null } | null
  }>(ANALYTICS_SALES_SUMMARY, {
    filter: {
      startDate: asIso(start),
      endDate: asIso(end),
      days: null,
      productId: null,
      productVariantId: null,
    },
  })
  const row = result.data?.salesSummary
  return {
    revenue: minorToMajorCurrencyAmount(row?.totalRevenue ?? 0),
    orders: Number(row?.totalProductSold ?? 0),
  }
}

export async function getMarketingDesk(): Promise<MarketingDesk> {
  const empty: MarketingDesk = { id: null, weeklyOffer: null, latestImages: [], updatedAt: null }
  try {
    const result = await runGraphQL<{
      marketingDesk: { id?: string; weeklyOffer?: unknown; latestImages?: unknown; updatedAt?: string }
    }>(MARKETING_DESK)
    if (result.errors?.length) return empty
    const desk = result.data?.marketingDesk
    return {
      id: desk?.id ?? null,
      weeklyOffer: parseOffer(desk?.weeklyOffer),
      latestImages: parseImages(desk?.latestImages),
      updatedAt: desk?.updatedAt ?? null,
    }
  } catch {
    return empty
  }
}

export async function getMarketingPulse(): Promise<MarketingPulse> {
  const now = new Date()
  const weekAgo = subDays(now, 7)
  const twoWeeksAgo = subDays(now, 14)

  const [thisWeek, lastWeek, products, banners, settings, desk, proposalsRes, liveCampaignRes] = await Promise.all([
    fetchSales(weekAgo, now),
    fetchSales(twoWeeksAgo, weekAgo),
    runGraphQL<{
      productSalesReport: MarketingPulseProduct[] | null
    }>(ANALYTICS_PRODUCT_SALES_REPORT, {
      filter: { dateStart: asIso(weekAgo), dateEnd: asIso(now) },
    }),
    runGraphQL<{
      banners: Array<{
        id: string
        title: string
        position?: string | null
        image?: string | null
        endDate?: string | null
        status?: { code?: string | null } | null
      }>
    }>(GET_BANNERS),
    runGraphQL<{
      storeSettings: {
        siteName?: string | null
        whatsappNumber?: string | null
        tagline?: string | null
        metaPixelId?: string | null
      }
    }>(GET_STORE_SETTINGS),
    getMarketingDesk(),
    runGraphQL<{ marketingProposals: Record<string, unknown>[] }>(MARKETING_PROPOSALS, {
      status: "pending",
    }),
    runGraphQL<{ marketingLiveCampaign: Record<string, unknown> | null }>(MARKETING_LIVE_CAMPAIGN),
  ])

  const liveBanners = (banners.data?.banners ?? [])
    .filter((b) => (b.status?.code ?? "ACTIVE") === "ACTIVE")
    .slice(0, 6)
    .map((b) => ({
      id: b.id,
      title: b.title,
      position: b.position,
      image: b.image,
      endDate: b.endDate,
    }))

  return {
    siteName: settings.data?.storeSettings?.siteName?.trim() || "Loja",
    whatsappNumber: settings.data?.storeSettings?.whatsappNumber?.trim() || null,
    revenueThisWeek: thisWeek.revenue,
    revenueLastWeek: lastWeek.revenue,
    ordersThisWeek: thisWeek.orders,
    ordersLastWeek: lastWeek.orders,
    topProducts: (products.data?.productSalesReport ?? []).slice(0, 5),
    liveBanners,
    desk,
    proposals: (proposalsRes.data?.marketingProposals ?? []).map(parseProposal),
    liveCampaign: parseMarketingCampaign(liveCampaignRes.data?.marketingLiveCampaign),
    campaignUrl: storefrontCampaignUrl(
      parseMarketingCampaign(liveCampaignRes.data?.marketingLiveCampaign),
    ),
    metaPixelId: settings.data?.storeSettings?.metaPixelId?.trim() || null,
  }
}

export async function createMarketingThread(title?: string): Promise<MarketingThread> {
  const result = await runGraphQL<{ createMarketingThread: MarketingThread }>(
    CREATE_MARKETING_THREAD,
    { title: title ?? "Conversa" }
  )
  if (result.errors?.length || !result.data?.createMarketingThread) {
    throw new Error(result.errors?.[0]?.message ?? "Não foi possível criar a conversa")
  }
  return result.data.createMarketingThread
}

export async function appendMarketingMessage(input: {
  threadId: string
  role: string
  content: string
  toolCalls?: unknown
}): Promise<MarketingMessage> {
  const result = await runGraphQL<{ appendMarketingMessage: MarketingMessage }>(
    APPEND_MARKETING_MESSAGE,
    input
  )
  if (result.errors?.length || !result.data?.appendMarketingMessage) {
    throw new Error(result.errors?.[0]?.message ?? "Não foi possível gravar a mensagem")
  }
  return result.data.appendMarketingMessage
}

export async function createMarketingProposal(input: {
  type: string
  title: string
  payload: Record<string, unknown>
  threadId?: string | null
  campaignId?: string | null
}): Promise<MarketingProposal> {
  const result = await runGraphQL<{ createMarketingProposal: Record<string, unknown> }>(
    CREATE_MARKETING_PROPOSAL,
    { input }
  )
  if (result.errors?.length || !result.data?.createMarketingProposal) {
    throw new Error(result.errors?.[0]?.message ?? "Não foi possível criar a proposta")
  }
  return parseProposal(result.data.createMarketingProposal)
}

export async function saveWeeklyOffer(input: MarketingWeeklyOffer) {
  const result = await runGraphQL<{ saveMarketingWeeklyOffer: { weeklyOffer: unknown } }>(
    SAVE_MARKETING_WEEKLY_OFFER,
    { input }
  )
  if (result.errors?.length) {
    throw new Error(result.errors[0]?.message ?? "Não foi possível gravar a oferta")
  }
}

export async function recordMarketingImage(input: MarketingImageRecord) {
  const result = await runGraphQL(RECORD_MARKETING_IMAGE, {
    input: { url: input.url, format: input.format, prompt: input.prompt },
  })
  if ("errors" in result && result.errors?.length) {
    throw new Error(result.errors[0]?.message ?? "Não foi possível gravar a imagem")
  }
}

export async function setProposalStatus(id: string, status: string, appliedNote?: string, campaignId?: string) {
  const result = await runGraphQL(UPDATE_MARKETING_PROPOSAL_STATUS, {
    id,
    status,
    appliedNote,
    campaignId: campaignId || null,
  })
  if ("errors" in result && result.errors?.length) {
    throw new Error(result.errors[0]?.message ?? "Não foi possível actualizar a proposta")
  }
}

export async function listMarketingCampaigns(): Promise<MarketingCampaign[]> {
  const result = await runGraphQL<{ marketingCampaigns: Record<string, unknown>[] }>(MARKETING_CAMPAIGNS)
  if (result.errors?.length) {
    throw new Error(result.errors[0]?.message ?? "Não foi possível listar as campanhas")
  }
  return (result.data?.marketingCampaigns ?? [])
    .map((row) => parseMarketingCampaign(row))
    .filter((row): row is MarketingCampaign => !!row)
}

export async function getMarketingCampaign(id: string): Promise<MarketingCampaign | null> {
  const result = await runGraphQL<{ marketingCampaign: Record<string, unknown> | null }>(MARKETING_CAMPAIGN, { id })
  if (result.errors?.length) return null
  return parseMarketingCampaign(result.data?.marketingCampaign)
}

export async function getLiveMarketingCampaign(): Promise<MarketingCampaign | null> {
  const result = await runGraphQL<{ marketingLiveCampaign: Record<string, unknown> | null }>(MARKETING_LIVE_CAMPAIGN)
  if (result.errors?.length) return null
  return parseMarketingCampaign(result.data?.marketingLiveCampaign)
}

export async function createMarketingCampaign(input: MarketingCampaignInput): Promise<MarketingCampaign> {
  const result = await runGraphQL<{ createMarketingCampaign: Record<string, unknown> }>(
    CREATE_MARKETING_CAMPAIGN,
    { input: campaignInputDates(input) },
  )
  const campaign = parseMarketingCampaign(result.data?.createMarketingCampaign)
  if (result.errors?.length || !campaign) {
    throw new Error(result.errors?.[0]?.message ?? "Não foi possível criar a campanha")
  }
  return campaign
}

export async function updateMarketingCampaign(id: string, input: MarketingCampaignInput): Promise<MarketingCampaign> {
  const result = await runGraphQL<{ updateMarketingCampaign: Record<string, unknown> }>(
    UPDATE_MARKETING_CAMPAIGN,
    { id, input: campaignInputDates(input) },
  )
  const campaign = parseMarketingCampaign(result.data?.updateMarketingCampaign)
  if (result.errors?.length || !campaign) {
    throw new Error(result.errors?.[0]?.message ?? "Não foi possível actualizar a campanha")
  }
  return campaign
}

export async function setMarketingCampaignStatus(id: string, status: string): Promise<MarketingCampaign> {
  const result = await runGraphQL<{ setMarketingCampaignStatus: Record<string, unknown> }>(
    SET_MARKETING_CAMPAIGN_STATUS,
    { id, status },
  )
  const campaign = parseMarketingCampaign(result.data?.setMarketingCampaignStatus)
  if (result.errors?.length || !campaign) {
    throw new Error(result.errors?.[0]?.message ?? "Não foi possível alterar o estado")
  }
  return campaign
}

export async function attachMarketingCampaignAssets(
  id: string,
  input: { bannerIds?: string[]; couponIds?: string[]; imageUrls?: string[] },
): Promise<MarketingCampaign> {
  const result = await runGraphQL<{ attachMarketingCampaignAssets: Record<string, unknown> }>(
    ATTACH_MARKETING_CAMPAIGN_ASSETS,
    { id, ...input },
  )
  const campaign = parseMarketingCampaign(result.data?.attachMarketingCampaignAssets)
  if (result.errors?.length || !campaign) {
    throw new Error(result.errors?.[0]?.message ?? "Não foi possível ligar as peças à campanha")
  }
  return campaign
}

export async function searchMarketingProducts(search: string, take = 8) {
  const result = await runGraphQL<{
    products: {
      data: Array<{
        id: string
        title: string
        image?: string | null
        discount?: number | null
        summary?: string | null
      }>
    }
  }>(GET_PRODUCTS, {
    filter: { search: search.trim() || null, status: "ACTIVE" },
    page: { page: 0, size: take },
  })
  return result.data?.products?.data ?? []
}

export async function getProductForMerch(id: string) {
  const result = await runGraphQL<{
    productDetails: {
      id: string
      title: string
      description?: string | null
      summary?: string | null
      image?: string | null
      discount?: number | null
      condition?: string | null
      metadata?: string | null
      type?: { code?: string | null } | null
      categoryId?: string | null
      brandId?: string | null
      category?: { id?: string | null } | null
      brand?: { id?: string | null } | null
    } | null
  }>(GET_PRODUCT, { id })
  return result.data?.productDetails ?? null
}

export function compactPulseText(pulse: MarketingPulse): string {
  const products = pulse.topProducts
    .map((p) => `${p.productTitle} (${p.totalSold} un.)`)
    .join("; ") || "sem dados"
  const banners = pulse.liveBanners.map((b) => `${b.title} [${b.position ?? "hero"}]`).join("; ") || "nenhum"
  const offer = pulse.desk.weeklyOffer
    ? `${pulse.desk.weeklyOffer.headline}${pulse.desk.weeklyOffer.hook ? ` — ${pulse.desk.weeklyOffer.hook}` : ""}`
    : "ainda não definida"
  const live = pulse.liveCampaign
    ? `${pulse.liveCampaign.name} [${pulse.liveCampaign.status}] ${pulse.liveCampaign.startDate ?? "?"} → ${pulse.liveCampaign.endDate ?? "?"}`
    : "nenhuma"
  return [
    `Loja: ${pulse.siteName}`,
    `WhatsApp: ${pulse.whatsappNumber || "não configurado"}`,
    `Receita 7d: ${Math.round(pulse.revenueThisWeek)} CVE (semana anterior ${Math.round(pulse.revenueLastWeek)})`,
    `Unidades 7d: ${pulse.ordersThisWeek}`,
    `Top produtos: ${products}`,
    `Banners live: ${banners}`,
    `Campanha live: ${live}`,
    `Destino do anúncio: ${pulse.campaignUrl}`,
    `Meta Pixel: ${pulse.metaPixelId || "não configurado (Definições → Loja)"}`,
    `Oferta da semana: ${offer}`,
  ].join("\n")
}
