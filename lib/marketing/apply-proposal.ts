import "server-only"
import { runGraphQL } from "@/lib/actions/graphql"
import {
  attachMarketingCampaignAssets,
  createMarketingCampaign,
  getMarketingDesk,
  getProductForMerch,
  saveWeeklyOffer,
  setProposalStatus,
  updateMarketingCampaign,
} from "@/lib/actions/marketing"
import { CREATE_BANNER, UPDATE_BANNER } from "@/lib/graphql/banners/mutations"
import { GET_BANNER } from "@/lib/graphql/banners/queries"
import { CREATE_COUPON, CREATE_PROMOTION_CODE } from "@/lib/graphql/coupons/mutations"
import { UPDATE_PRODUCT } from "@/lib/graphql/products/mutations"
import type { MarketingCampaignInput, MarketingProposal } from "@/lib/graphql/marketing/types"

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : ""
}

function num(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v
  if (typeof v === "string" && v.trim() && Number.isFinite(Number(v))) return Number(v)
  return undefined
}

function strList(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((item): item is string => typeof item === "string" && !!item.trim())
}

function campaignIdOf(proposal: MarketingProposal): string {
  return str(proposal.campaignId) || str(proposal.payload.campaignId)
}

async function attachIfLinked(
  proposal: MarketingProposal,
  assets: { bannerIds?: string[]; couponIds?: string[]; imageUrls?: string[] },
) {
  const campaignId = campaignIdOf(proposal)
  if (!campaignId) return
  const hasAssets = (assets.bannerIds?.length || 0) + (assets.couponIds?.length || 0) + (assets.imageUrls?.length || 0)
  if (!hasAssets) return
  try {
    await attachMarketingCampaignAssets(campaignId, assets)
  } catch {
    // A peça principal (banner/cupão) já foi criada — não falhar a aplicação por um vínculo.
  }
}

export type ApplyProposalResult = {
  note: string
  campaignId?: string
}

export async function applyMarketingProposal(proposal: MarketingProposal): Promise<ApplyProposalResult> {
  const p = proposal.payload
  switch (proposal.type) {
    case "campaign": {
      const name = str(p.name) || proposal.title
      if (!name) throw new Error("A campanha precisa de um nome")
      const input: MarketingCampaignInput = {
        name,
        objective: str(p.objective) || "sell",
        startDate: str(p.startDate) || null,
        endDate: str(p.endDate) || null,
        channels: strList(p.channels),
        brief: str(p.brief) || null,
        headline: str(p.headline) || name,
        hook: str(p.hook) || null,
        facebookPost: str(p.facebookPost) || null,
        instagramCaption: str(p.instagramCaption) || null,
        whatsappText: str(p.whatsappText) || null,
        productIds: strList(p.productIds),
        imageUrls: strList(p.imageUrls),
        destinationType: str(p.destinationType) || "campaign",
        destinationHref: str(p.destinationHref) || null,
        slug: str(p.slug) || null,
        pageTheme: str(p.pageTheme) || "default",
        siteTopEnabled: Boolean(p.siteTopEnabled),
        siteTopText: str(p.siteTopText) || null,
        siteTopSubtext: str(p.siteTopSubtext) || null,
        siteTopCtaLabel: str(p.siteTopCtaLabel) || null,
        siteTopCtaHref: str(p.siteTopCtaHref) || null,
        siteTopSecondaryCtaLabel: str(p.siteTopSecondaryCtaLabel) || null,
        siteTopSecondaryCtaHref: str(p.siteTopSecondaryCtaHref) || null,
        status: "live",
      }
      const created = await createMarketingCampaign(input)
      return { note: `Campanha «${created.name}» ${created.status === "live" ? "live" : "criada"}`, campaignId: created.id }
    }
    case "campaign_attach": {
      const campaignId = str(p.campaignId) || campaignIdOf(proposal)
      if (!campaignId) throw new Error("Indica a campanha a ligar")
      await attachMarketingCampaignAssets(campaignId, {
        bannerIds: strList(p.bannerIds),
        couponIds: strList(p.couponIds),
        imageUrls: strList(p.imageUrls),
      })
      return { note: "Peças ligadas à campanha", campaignId }
    }
    case "weekly_offer": {
      const headline = str(p.headline)
      if (!headline) throw new Error("A oferta precisa de um título")
      await saveWeeklyOffer({
        headline,
        hook: str(p.hook) || null,
        productIds: strList(p.productIds),
        productLabel: str(p.productLabel) || null,
        facebookPost: str(p.facebookPost) || null,
        instagramCaption: str(p.instagramCaption) || null,
        whatsappText: str(p.whatsappText) || null,
        endsAt: str(p.endsAt) || null,
      })
      return { note: "Oferta da semana actualizada", campaignId: campaignIdOf(proposal) || undefined }
    }
    case "social_pack": {
      const current = await getMarketingDesk()
      const headline = str(p.headline) || current.weeklyOffer?.headline || proposal.title
      await saveWeeklyOffer({
        headline,
        hook: str(p.hook) || current.weeklyOffer?.hook || null,
        productIds: current.weeklyOffer?.productIds ?? [],
        productLabel: current.weeklyOffer?.productLabel || null,
        facebookPost: str(p.facebookPost) || current.weeklyOffer?.facebookPost || null,
        instagramCaption: str(p.instagramCaption) || current.weeklyOffer?.instagramCaption || null,
        whatsappText: str(p.whatsappText) || current.weeklyOffer?.whatsappText || null,
        endsAt: current.weeklyOffer?.endsAt || null,
      })
      const campaignId = campaignIdOf(proposal)
      if (campaignId) {
        const patch: MarketingCampaignInput = {}
        if (str(p.facebookPost)) patch.facebookPost = str(p.facebookPost)
        if (str(p.instagramCaption)) patch.instagramCaption = str(p.instagramCaption)
        if (str(p.whatsappText)) patch.whatsappText = str(p.whatsappText)
        if (Object.keys(patch).length) {
          await updateMarketingCampaign(campaignId, patch)
        }
      }
      return { note: "Pack Facebook / Instagram gravado na secretária", campaignId: campaignId || undefined }
    }
    case "banner": {
      const title = str(p.title)
      const desk = await getMarketingDesk()
      const image = str(p.imageUrl) || desk.latestImages[0]?.url || ""
      if (!title) throw new Error("Banner sem título")
      if (!image) {
        throw new Error("Gera a imagem à direita e volta a meter o banner no site")
      }
      const result = await runGraphQL<{ createBanner: { id: string } }>(CREATE_BANNER, {
        input: {
          title,
          subtitle: str(p.subtitle) || null,
          description: str(p.description) || null,
          image,
          link: str(p.link) || str(p.destinationHref) || "/campanha",
          buttonText: str(p.buttonText) || "Ver ofertas",
          position: str(p.position) || "hero",
          orderIndex: num(p.orderIndex) ?? 0,
          startDate: str(p.startDate) || null,
          endDate: str(p.endDate) || null,
          status: { code: "ACTIVE", description: "Ativo" },
        },
      })
      if ("errors" in result && result.errors?.length) {
        throw new Error(result.errors[0]?.message ?? "Falha ao criar banner")
      }
      const bannerId = result.data?.createBanner?.id
      await attachIfLinked(proposal, {
        bannerIds: bannerId ? [bannerId] : [],
        imageUrls: image ? [image] : [],
      })
      return { note: "Banner no site", campaignId: campaignIdOf(proposal) || undefined }
    }
    case "banner_update": {
      const bannerId = str(p.bannerId)
      if (!bannerId) throw new Error("Indica o banner a alterar")
      const currentRes = await runGraphQL<{
        bannerDetails: {
          id: string
          title: string
          subtitle?: string | null
          description?: string | null
          image: string
          link?: string | null
          buttonText?: string | null
          position?: string | null
          orderIndex?: number | null
          startDate?: string | null
          endDate?: string | null
          status?: { code?: string | null } | null
        } | null
      }>(GET_BANNER, { id: bannerId })
      const current = currentRes.data?.bannerDetails
      if ("errors" in currentRes && currentRes.errors?.length) {
        throw new Error(currentRes.errors[0]?.message ?? "Banner não encontrado")
      }
      if (!current) throw new Error("Banner não encontrado")
      const desk = await getMarketingDesk()
      const image = str(p.imageUrl) || current.image || desk.latestImages[0]?.url || ""
      if (!image) throw new Error("Este banner precisa de uma imagem")
      const statusCode = str(p.status).toUpperCase() || current.status?.code || "ACTIVE"
      const result = await runGraphQL<{ updateBanner: { id: string } }>(UPDATE_BANNER, {
        id: bannerId,
        input: {
          title: str(p.title) || current.title,
          subtitle: str(p.subtitle) || current.subtitle || null,
          description: str(p.description) || current.description || null,
          image,
          link: str(p.link) || current.link || null,
          buttonText: str(p.buttonText) || current.buttonText || null,
          position: str(p.position) || current.position || "hero",
          orderIndex: num(p.orderIndex) ?? current.orderIndex ?? 0,
          startDate: str(p.startDate) || current.startDate || null,
          endDate: str(p.endDate) || current.endDate || null,
          status: {
            code: statusCode === "INACTIVE" ? "INACTIVE" : "ACTIVE",
            description: statusCode === "INACTIVE" ? "Inativo" : "Ativo",
          },
        },
      })
      if ("errors" in result && result.errors?.length) {
        throw new Error(result.errors[0]?.message ?? "Falha ao actualizar banner")
      }
      await attachIfLinked(proposal, {
        bannerIds: [bannerId],
        imageUrls: str(p.imageUrl) ? [image] : [],
      })
      return {
        note: statusCode === "INACTIVE" ? "Banner desligado" : "Banner actualizado",
        campaignId: campaignIdOf(proposal) || undefined,
      }
    }
    case "coupon": {
      const name = str(p.name) || proposal.title
      const code = str(p.code).replace(/\s+/g, "").toUpperCase()
      if (!code) throw new Error("Cupão sem código")
      const percentOff = num(p.percentOff)
      const amountOff = num(p.amountOff)
      if (percentOff == null && amountOff == null) {
        throw new Error("O cupão precisa de percentagem ou valor em CVE")
      }
      if (percentOff != null && amountOff != null) {
        throw new Error("Usa percentagem ou valor, não os dois")
      }
      const couponRes = await runGraphQL<{ createCoupon: { id: string } }>(CREATE_COUPON, {
        input: {
          name,
          percentOff: percentOff ?? null,
          amountOff: amountOff ?? null,
          currency: amountOff ? "CVE" : null,
          duration: "ONCE",
          maxRedemptions: num(p.maxRedemptions) ?? 100,
        },
      })
      if (couponRes.errors?.length || !couponRes.data?.createCoupon?.id) {
        throw new Error(couponRes.errors?.[0]?.message ?? "Falha ao criar cupão")
      }
      const codeRes = await runGraphQL(CREATE_PROMOTION_CODE, {
        input: {
          code,
          maxRedemptions: num(p.maxRedemptions) ?? 100,
          couponId: couponRes.data.createCoupon.id,
        },
      })
      if ("errors" in codeRes && codeRes.errors?.length) {
        throw new Error(codeRes.errors[0]?.message ?? "Cupão criado, mas o código falhou")
      }
      await attachIfLinked(proposal, { couponIds: [couponRes.data.createCoupon.id] })
      return { note: `Cupão ${code} criado`, campaignId: campaignIdOf(proposal) || undefined }
    }
    case "product_merch": {
      const productId = str(p.productId)
      if (!productId) throw new Error("Produto em falta")
      const product = await getProductForMerch(productId)
      if (!product) throw new Error("Produto não encontrado")
      let metadata = product.metadata ?? null
      if (p.featured === true) {
        try {
          const parsed = metadata ? (JSON.parse(metadata) as Record<string, unknown>) : {}
          parsed.featured = true
          metadata = JSON.stringify(parsed)
        } catch {
          metadata = JSON.stringify({ featured: true })
        }
      }
      if (!product.type?.code) {
        throw new Error("Este produto não tem tipo no catálogo — não dá para aplicar o desconto daqui")
      }
      const result = await runGraphQL(UPDATE_PRODUCT, {
        input: {
          title: product.title,
          description: product.description,
          summary: product.summary,
          image: product.image,
          discount: num(p.discount) ?? product.discount ?? 0,
          metadata,
          type: { code: product.type.code },
          categoryId: product.category?.id ?? null,
          brandId: product.brand?.id ?? null,
        },
        id: productId,
      })
      if ("errors" in result && result.errors?.length) {
        throw new Error(result.errors[0]?.message ?? "Falha ao actualizar produto")
      }
      return { note: "Produto actualizado (desconto / destaque)", campaignId: campaignIdOf(proposal) || undefined }
    }
    case "image_prompt": {
      return { note: "Prompt pronto — usa o estúdio de imagens à direita", campaignId: campaignIdOf(proposal) || undefined }
    }
    default:
      throw new Error(`Tipo de proposta não aplicável: ${proposal.type}`)
  }
}

export async function markProposalApplied(id: string, note: string, campaignId?: string) {
  await setProposalStatus(id, "applied", note, campaignId)
}

export async function markProposalRejected(id: string) {
  await setProposalStatus(id, "rejected")
}
