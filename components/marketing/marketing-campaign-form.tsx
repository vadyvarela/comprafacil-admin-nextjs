"use client"

import { useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ImageIcon, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { showToast } from "@/lib/utils/toast"
import { cn } from "@/lib/utils"
import type { MarketingCampaign } from "@/lib/graphql/marketing/types"
import {
  CAMPAIGN_CHANNELS,
  CAMPAIGN_DESTINATIONS,
  CAMPAIGN_OBJECTIVES,
  CAMPAIGN_PAGE_THEMES,
  campaignStatusClass,
  campaignStatusLabel,
  slugifyCampaign,
  toDateInputValue,
} from "@/lib/marketing/campaigns"
import { storefrontCampaignUrl } from "@/lib/marketing/storefront"
import { buildMarketingAdsBrief } from "@/lib/marketing/ads-brief"
import { MarketingAdsBriefPanel } from "@/components/marketing/marketing-ads-brief"
import { MarketingPostPreview } from "@/components/marketing/marketing-post-preview"
import { CuratedProductPicker } from "@/components/store-home/curated-product-picker"

type FormState = {
  name: string
  objective: string
  startDate: string
  endDate: string
  channels: string[]
  brief: string
  headline: string
  hook: string
  facebookPost: string
  instagramCaption: string
  whatsappText: string
  destinationType: string
  destinationHref: string
  slug: string
  pageTheme: string
  siteTopEnabled: boolean
  siteTopText: string
  siteTopSubtext: string
  siteTopCtaLabel: string
  siteTopCtaHref: string
  siteTopSecondaryCtaLabel: string
  siteTopSecondaryCtaHref: string
  productIds: string[]
  imageUrls: string[]
}

function fromCampaign(campaign?: MarketingCampaign | null): FormState {
  const slug = campaign?.slug?.trim() || ""
  return {
    name: campaign?.name ?? "",
    objective: campaign?.objective || "sell",
    startDate: toDateInputValue(campaign?.startDate),
    endDate: toDateInputValue(campaign?.endDate),
    channels: campaign?.channels?.length ? campaign.channels : ["store", "facebook", "instagram"],
    brief: campaign?.brief ?? "",
    headline: campaign?.headline ?? "",
    hook: campaign?.hook ?? "",
    facebookPost: campaign?.facebookPost ?? "",
    instagramCaption: campaign?.instagramCaption ?? "",
    whatsappText: campaign?.whatsappText ?? "",
    destinationType: campaign?.destinationType || "campaign",
    destinationHref:
      campaign?.destinationType === "campaign"
        ? slug
          ? `/campanha/${slug}`
          : "/campanha"
        : campaign?.destinationHref ?? "",
    slug,
    pageTheme: campaign?.pageTheme || "default",
    siteTopEnabled: Boolean(campaign?.siteTopEnabled),
    siteTopText: campaign?.siteTopText ?? "",
    siteTopSubtext: campaign?.siteTopSubtext ?? "",
    siteTopCtaLabel: campaign?.siteTopCtaLabel ?? "",
    siteTopCtaHref: campaign?.siteTopCtaHref ?? "",
    siteTopSecondaryCtaLabel: campaign?.siteTopSecondaryCtaLabel ?? "",
    siteTopSecondaryCtaHref: campaign?.siteTopSecondaryCtaHref ?? "",
    productIds: campaign?.productIds ?? [],
    imageUrls: campaign?.imageUrls ?? [],
  }
}

export function MarketingCampaignForm({
  campaign,
  metaPixelId,
  siteName = "Loja",
}: {
  campaign?: MarketingCampaign | null
  campaignUrl?: string
  metaPixelId?: string | null
  siteName?: string
}) {
  const router = useRouter()
  const [form, setForm] = useState(() => fromCampaign(campaign))
  const [status, setStatus] = useState(campaign?.status ?? "draft")
  const [saving, setSaving] = useState(false)
  const [statusBusy, setStatusBusy] = useState<string | null>(null)
  const [imagePrompt, setImagePrompt] = useState("")
  const [imageFormat, setImageFormat] = useState<"feed" | "stories" | "banner">("feed")
  const [busyImage, setBusyImage] = useState(false)
  const [tab, setTab] = useState<"criativo" | "loja" | "definicoes">("criativo")
  const [previewChannel, setPreviewChannel] = useState<"facebook" | "instagram">("facebook")

  const campaignSlug = form.slug.trim() ? slugifyCampaign(form.slug) : ""
  const previewUrl = storefrontCampaignUrl({
    destinationType: form.destinationType,
    destinationHref:
      form.destinationType === "campaign"
        ? campaignSlug
          ? `/campanha/${campaignSlug}`
          : "/campanha"
        : form.destinationHref,
    slug: campaignSlug || null,
  })

  const draftCampaign: MarketingCampaign = {
    id: campaign?.id ?? "draft",
    name: form.name || campaign?.name || "Campanha",
    status: status,
    objective: form.objective,
    startDate: form.startDate || null,
    endDate: form.endDate || null,
    channels: form.channels,
    brief: form.brief || null,
    headline: form.headline || null,
    hook: form.hook || null,
    facebookPost: form.facebookPost || null,
    instagramCaption: form.instagramCaption || null,
    whatsappText: form.whatsappText || null,
    productIds: form.productIds,
    bannerIds: campaign?.bannerIds ?? [],
    couponIds: campaign?.couponIds ?? [],
    imageUrls: form.imageUrls,
    destinationType: form.destinationType,
    destinationHref:
      form.destinationType === "campaign"
        ? campaignSlug
          ? `/campanha/${campaignSlug}`
          : "/campanha"
        : form.destinationHref || null,
    slug: campaignSlug || null,
    pageTheme: form.pageTheme || "default",
    siteTopEnabled: form.siteTopEnabled,
    siteTopText: form.siteTopText || null,
    siteTopSubtext: form.siteTopSubtext || null,
    siteTopCtaLabel: form.siteTopCtaLabel || null,
    siteTopCtaHref: form.siteTopCtaHref || null,
    siteTopSecondaryCtaLabel: form.siteTopSecondaryCtaLabel || null,
    siteTopSecondaryCtaHref: form.siteTopSecondaryCtaHref || null,
    createdAt: campaign?.createdAt ?? null,
    updatedAt: campaign?.updatedAt ?? null,
  }

  const adsBrief = buildMarketingAdsBrief({
    campaign: draftCampaign,
    metaPixelId,
  })

  function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function setDestinationType(type: string) {
    setForm((prev) => ({
      ...prev,
      destinationType: type,
      destinationHref:
        type === "campaign"
          ? "/campanha"
          : type === "product"
            ? prev.destinationHref.startsWith("/produto/")
              ? prev.destinationHref
              : ""
            : prev.destinationHref.startsWith("/categoria/")
              ? prev.destinationHref
              : "",
    }))
  }

  function toggleChannel(id: string) {
    setForm((prev) => ({
      ...prev,
      channels: prev.channels.includes(id)
        ? prev.channels.filter((item) => item !== id)
        : [...prev.channels, id],
    }))
  }

  async function save() {
    if (!form.name.trim() || saving) return
    if (form.destinationType !== "campaign" && !form.destinationHref.trim()) {
      showToast.error(
        form.destinationType === "product"
          ? "Indica o caminho do produto (ex. /produto/samsung-a16)"
          : "Indica o caminho da categoria (ex. /categoria/telemoveis)",
      )
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        objective: form.objective,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        channels: form.channels,
        brief: form.brief.trim() || null,
        headline: form.headline.trim() || null,
        hook: form.hook.trim() || null,
        facebookPost: form.facebookPost.trim() || null,
        instagramCaption: form.instagramCaption.trim() || null,
        whatsappText: form.whatsappText.trim() || null,
        destinationType: form.destinationType,
        destinationHref:
          form.destinationType === "campaign"
            ? campaignSlug
              ? `/campanha/${campaignSlug}`
              : "/campanha"
            : form.destinationHref.trim() || null,
        slug: form.destinationType === "campaign" ? campaignSlug || null : null,
        pageTheme: form.pageTheme || "default",
        siteTopEnabled: form.siteTopEnabled,
        siteTopText: form.siteTopText.trim() || null,
        siteTopSubtext: form.siteTopSubtext.trim() || null,
        siteTopCtaLabel: form.siteTopCtaLabel.trim() || null,
        siteTopCtaHref: form.siteTopCtaHref.trim() || null,
        siteTopSecondaryCtaLabel: form.siteTopSecondaryCtaLabel.trim() || null,
        siteTopSecondaryCtaHref: form.siteTopSecondaryCtaHref.trim() || null,
        productIds: form.productIds,
        imageUrls: form.imageUrls,
      }
      const url = campaign ? `/api/marketing/campaigns/${campaign.id}` : "/api/marketing/campaigns"
      const res = await fetch(url, {
        method: campaign ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = (await res.json()) as { error?: string; campaign?: MarketingCampaign }
      if (!res.ok) throw new Error(data.error || "Falha ao guardar")
      showToast.success(campaign ? "Campanha actualizada" : "Campanha criada")
      if (!campaign && data.campaign?.id) {
        router.replace(`/dashboard/marketing/campaigns/${data.campaign.id}`)
        return
      }
      if (data.campaign?.status) setStatus(data.campaign.status)
      router.refresh()
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : "Falha ao guardar")
    } finally {
      setSaving(false)
    }
  }

  async function changeStatus(next: string) {
    if (!campaign || statusBusy) return
    setStatusBusy(next)
    try {
      const res = await fetch(`/api/marketing/campaigns/${campaign.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      })
      const data = (await res.json()) as { error?: string; campaign?: MarketingCampaign }
      if (!res.ok) throw new Error(data.error || "Falha")
      if (data.campaign?.status) setStatus(data.campaign.status)
      showToast.success(`Estado: ${campaignStatusLabel(data.campaign?.status || next)}`)
      router.refresh()
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : "Falha")
    } finally {
      setStatusBusy(null)
    }
  }

  async function generateImage() {
    const prompt = imagePrompt.trim() || form.headline.trim() || form.name.trim()
    if (!prompt || busyImage) return
    setBusyImage(true)
    try {
      const res = await fetch("/api/marketing/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          format: imageFormat,
          campaignId: campaign?.id,
        }),
      })
      const data = (await res.json()) as { error?: string; url?: string }
      if (!res.ok) throw new Error(data.error || "Falha a gerar")
      if (data.url) {
        patch("imageUrls", [data.url, ...form.imageUrls.filter((u) => u !== data.url)])
        showToast.success("Imagem pronta")
      }
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : "Falha a gerar imagem")
    } finally {
      setBusyImage(false)
    }
  }

  async function copyText(label: string, text: string) {
    if (!text.trim()) {
      showToast.info("Ainda não há texto para copiar")
      return
    }
    await navigator.clipboard.writeText(text)
    showToast.success(`${label} copiado`)
  }

  const tabs = [
    { id: "criativo" as const, label: "Criativo" },
    { id: "loja" as const, label: "Loja" },
    { id: "definicoes" as const, label: "Definições" },
  ]
  const previewCaption = previewChannel === "facebook" ? form.facebookPost : form.instagramCaption
  const coverUrl = form.imageUrls[0] ?? null

  function setCover(url: string) {
    patch("imageUrls", [url, ...form.imageUrls.filter((item) => item !== url)])
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-border bg-background px-3">
        {campaign ? (
          <Badge variant="outline" className={cn("shrink-0 text-[10px]", campaignStatusClass(status))}>
            {campaignStatusLabel(status)}
          </Badge>
        ) : (
          <p className="shrink-0 text-[12px] text-muted-foreground">Rascunho</p>
        )}
        <div className="flex min-w-0 items-center gap-0.5">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "h-6 rounded-md px-2 text-[12px] font-medium",
                tab === item.id
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          {campaign && status !== "live" ? (
            <Button type="button" size="sm" className="h-7 text-[11px]" disabled={!!statusBusy} onClick={() => void changeStatus("live")}>
              {statusBusy === "live" ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              Activar
            </Button>
          ) : null}
          {campaign && status !== "scheduled" ? (
            <Button type="button" size="sm" variant="outline" className="h-7 text-[11px]" disabled={!!statusBusy} onClick={() => void changeStatus("scheduled")}>
              Agendar
            </Button>
          ) : null}
          {campaign && status !== "ended" ? (
            <Button type="button" size="sm" variant="outline" className="h-7 text-[11px]" disabled={!!statusBusy} onClick={() => void changeStatus("ended")}>
              Encerrar
            </Button>
          ) : null}
          {campaign && status !== "draft" ? (
            <Button type="button" size="sm" variant="ghost" className="h-7 text-[11px]" disabled={!!statusBusy} onClick={() => void changeStatus("draft")}>
              Rascunho
            </Button>
          ) : null}
          <Button type="button" size="sm" className="h-7 text-[11px]" disabled={saving || !form.name.trim()} onClick={() => void save()}>
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            Guardar
          </Button>
        </div>
      </div>

      {tab === "criativo" ? (
        <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[minmax(0,1fr)_17.5rem]">
          <div className="min-h-0 overflow-y-auto p-4">
            <label className="block text-[11px] font-medium text-muted-foreground">Nome</label>
            <Input
              value={form.name}
              onChange={(e) => patch("name", e.target.value)}
              placeholder="Semana de salário — 25 a 31 de Agosto"
              className="mt-1 h-8 text-xs"
            />
            <label className="mt-3 block text-[11px] font-medium text-muted-foreground">Facebook</label>
            <Textarea
              value={form.facebookPost}
              onChange={(e) => {
                patch("facebookPost", e.target.value)
                setPreviewChannel("facebook")
              }}
              className="mt-1 min-h-[88px] text-xs"
            />
            <label className="mt-3 block text-[11px] font-medium text-muted-foreground">Instagram</label>
            <Textarea
              value={form.instagramCaption}
              onChange={(e) => {
                patch("instagramCaption", e.target.value)
                setPreviewChannel("instagram")
              }}
              className="mt-1 min-h-[88px] text-xs"
            />
            <label className="mt-3 block text-[11px] font-medium text-muted-foreground">WhatsApp</label>
            <Textarea
              value={form.whatsappText}
              onChange={(e) => patch("whatsappText", e.target.value)}
              className="mt-1 min-h-[56px] text-xs"
            />
            <div className="mt-2 flex flex-wrap gap-1">
              <CopyChip label="Facebook" onClick={() => void copyText("Facebook", form.facebookPost)} />
              <CopyChip label="Instagram" onClick={() => void copyText("Instagram", form.instagramCaption)} />
              <CopyChip label="WhatsApp" onClick={() => void copyText("WhatsApp", form.whatsappText)} />
            </div>

            <p className="mt-5 text-[12px] font-semibold">Imagens</p>
            <p className="text-[12px] text-muted-foreground">A primeira é a capa do post. Clica noutro para a promover.</p>
            {form.imageUrls.length > 0 ? (
              <ul className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {form.imageUrls.map((url, index) => (
                  <li key={url} className={cn("overflow-hidden rounded-md border", index === 0 ? "border-foreground" : "border-border")}>
                    <button type="button" className="block w-full" onClick={() => setCover(url)}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="aspect-square w-full object-cover" />
                    </button>
                    <div className="flex items-center justify-between px-1.5 py-1">
                      <span className="text-[10px] text-muted-foreground">{index === 0 ? "Capa" : "Usar"}</span>
                      <button
                        type="button"
                        className="text-[10px] text-muted-foreground hover:text-foreground"
                        onClick={() => patch("imageUrls", form.imageUrls.filter((item) => item !== url))}
                      >
                        Tirar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-[12px] text-muted-foreground">Ainda sem imagem.</p>
            )}
            <div className="mt-3 flex gap-1">
              {(["feed", "stories", "banner"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setImageFormat(item)}
                  className={cn(
                    "h-6 rounded border px-2 text-[11px]",
                    imageFormat === item
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item === "feed" ? "Feed" : item === "stories" ? "Stories" : "Banner"}
                </button>
              ))}
            </div>
            <Textarea
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              placeholder={form.headline || form.name || "Ex.: Samsung A16 no balcão, fundo azul da loja"}
              className="mt-2 min-h-16 field-sizing-fixed text-xs"
            />
            <Button
              type="button"
              size="sm"
              className="mt-2 h-8"
              disabled={busyImage || !(imagePrompt.trim() || form.headline.trim() || form.name.trim())}
              onClick={() => void generateImage()}
            >
              {busyImage ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
              {busyImage ? "A gerar…" : form.imageUrls.length ? "Gerar nova" : "Gerar imagem"}
            </Button>
          </div>

          <aside className="hidden min-h-0 overflow-y-auto border-l border-border bg-muted/20 p-3 lg:block">
            <MarketingPostPreview
              siteName={siteName}
              imageUrl={coverUrl}
              caption={previewCaption}
              channel={previewChannel}
              onChannel={setPreviewChannel}
            />
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex items-center justify-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-3 w-3" />
              Abrir na loja
            </a>
          </aside>
        </div>
      ) : null}

      {tab === "loja" ? (
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="mx-auto max-w-2xl">
            <label className="block text-[11px] font-medium text-muted-foreground">Título na página</label>
            <Input
              value={form.headline}
              onChange={(e) => patch("headline", e.target.value)}
              placeholder="Samsung A16 a 18.900 CVE até sexta"
              className="mt-1 h-8 text-xs"
            />
            <label className="mt-3 block text-[11px] font-medium text-muted-foreground">Subtítulo</label>
            <Input
              value={form.hook}
              onChange={(e) => patch("hook", e.target.value)}
              className="mt-1 h-8 text-xs"
            />
            <p className="mt-5 text-[12px] font-semibold">Produtos em /campanha</p>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              Estes é que aparecem na página. Pesquisa e escolhe. Depois Guardar.
            </p>
            <div className="mt-3">
              <CuratedProductPicker
                value={form.productIds}
                max={24}
                onChange={(ids) => patch("productIds", ids)}
                orderLabel="Ordem na página"
                description="Pesquisa pelo nome. Clica para juntar ou tirar. Máximo 24."
              />
            </div>
            <div className="mt-6 flex items-start justify-between gap-2">
              <div>
                <p className="text-[12px] font-semibold">Faixa no topo do site</p>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  Aparece em todas as páginas enquanto a campanha estiver live.
                </p>
              </div>
              <button
                type="button"
                onClick={() => patch("siteTopEnabled", !form.siteTopEnabled)}
                className={cn(
                  "h-7 rounded-md border px-2 text-[11px]",
                  form.siteTopEnabled
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                    : "border-border bg-background text-muted-foreground",
                )}
              >
                {form.siteTopEnabled ? "Activa" : "Desligada"}
              </button>
            </div>
            {form.siteTopEnabled ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-medium text-muted-foreground">Texto</label>
                  <Input
                    value={form.siteTopText}
                    onChange={(e) => patch("siteTopText", e.target.value)}
                    placeholder="Black Friday — até 40% em telemóveis"
                    className="mt-1 h-8 text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-medium text-muted-foreground">Subtexto</label>
                  <Input
                    value={form.siteTopSubtext}
                    onChange={(e) => patch("siteTopSubtext", e.target.value)}
                    placeholder="Só esta semana · descontos reais"
                    className="mt-1 h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground">CTA</label>
                  <Input
                    value={form.siteTopCtaLabel}
                    onChange={(e) => patch("siteTopCtaLabel", e.target.value)}
                    placeholder="Ver campanha"
                    className="mt-1 h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground">Link CTA</label>
                  <Input
                    value={form.siteTopCtaHref}
                    onChange={(e) => patch("siteTopCtaHref", e.target.value)}
                    placeholder={campaignSlug ? `/campanha/${campaignSlug}` : "/campanha"}
                    className="mt-1 h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground">CTA secundário</label>
                  <Input
                    value={form.siteTopSecondaryCtaLabel}
                    onChange={(e) => patch("siteTopSecondaryCtaLabel", e.target.value)}
                    placeholder="Ver ofertas"
                    className="mt-1 h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground">Link secundário</label>
                  <Input
                    value={form.siteTopSecondaryCtaHref}
                    onChange={(e) => patch("siteTopSecondaryCtaHref", e.target.value)}
                    placeholder="/ofertas"
                    className="mt-1 h-8 text-xs"
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {tab === "definicoes" ? (
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="mx-auto max-w-2xl">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground">Início</label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => patch("startDate", e.target.value)}
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground">Fim</label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => patch("endDate", e.target.value)}
                  className="mt-1 h-8 text-xs"
                />
              </div>
            </div>
            <p className="mt-3 text-[11px] font-medium text-muted-foreground">Objectivo</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {CAMPAIGN_OBJECTIVES.map((item) => (
                <Chip key={item.id} active={form.objective === item.id} onClick={() => patch("objective", item.id)}>
                  {item.label}
                </Chip>
              ))}
            </div>
            <p className="mt-3 text-[11px] font-medium text-muted-foreground">Canais</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {CAMPAIGN_CHANNELS.map((item) => (
                <Chip key={item.id} active={form.channels.includes(item.id)} onClick={() => toggleChannel(item.id)}>
                  {item.label}
                </Chip>
              ))}
            </div>
            <p className="mt-3 text-[11px] font-medium text-muted-foreground">Para onde o anúncio manda</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {CAMPAIGN_DESTINATIONS.map((item) => (
                <Chip key={item.id} active={form.destinationType === item.id} onClick={() => setDestinationType(item.id)}>
                  {item.label}
                </Chip>
              ))}
            </div>
            {form.destinationType === "campaign" ? (
              <>
                <label className="mt-3 block text-[11px] font-medium text-muted-foreground">Slug da página</label>
                <Input
                  value={form.slug}
                  onChange={(e) => patch("slug", e.target.value)}
                  placeholder="black-friday"
                  className="mt-1 h-8 text-xs"
                />
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Vazio = /campanha · com slug = /campanha/{campaignSlug || "…"}
                </p>
                <p className="mt-3 text-[11px] font-medium text-muted-foreground">Visual da página</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {CAMPAIGN_PAGE_THEMES.map((item) => (
                    <Chip key={item.id} active={form.pageTheme === item.id} onClick={() => patch("pageTheme", item.id)}>
                      {item.label}
                    </Chip>
                  ))}
                </div>
              </>
            ) : (
              <>
                <label className="mt-3 block text-[11px] font-medium text-muted-foreground">
                  Caminho ({form.destinationType === "product" ? "/produto/…" : "/categoria/…"})
                </label>
                <Input
                  value={form.destinationHref}
                  onChange={(e) => patch("destinationHref", e.target.value)}
                  placeholder={
                    form.destinationType === "product" ? "/produto/samsung-a16" : "/categoria/telemoveis"
                  }
                  className="mt-1 h-8 text-xs"
                />
              </>
            )}
            <label className="mt-3 block text-[11px] font-medium text-muted-foreground">Nota interna</label>
            <Textarea
              value={form.brief}
              onChange={(e) => patch("brief", e.target.value)}
              placeholder="O que esta semana tem de vender…"
              className="mt-1 min-h-[72px] text-xs"
            />
            {campaign && (campaign.bannerIds.length || campaign.couponIds.length) ? (
              <dl className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <dt className="text-muted-foreground">Banners</dt>
                  <dd className="tabular-nums">{campaign.bannerIds.length}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Cupões</dt>
                  <dd className="tabular-nums">{campaign.couponIds.length}</dd>
                </div>
              </dl>
            ) : null}
            <p className="mb-2 mt-5 text-[12px] font-semibold">Links para anúncios</p>
            <MarketingAdsBriefPanel brief={adsBrief} />
          </div>
        </div>
      ) : null}
    </div>
  )
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-7 rounded-md border px-2 text-[11px]",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-background text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}

function CopyChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-6 rounded border border-border px-2 text-[11px] text-muted-foreground hover:text-foreground"
    >
      Copiar {label}
    </button>
  )
}
