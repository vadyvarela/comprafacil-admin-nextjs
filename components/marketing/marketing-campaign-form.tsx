"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
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
  }
}

export function MarketingCampaignForm({
  campaign,
  metaPixelId,
}: {
  campaign?: MarketingCampaign | null
  campaignUrl?: string
  metaPixelId?: string | null
}) {
  const router = useRouter()
  const [form, setForm] = useState(() => fromCampaign(campaign))
  const [status, setStatus] = useState(campaign?.status ?? "draft")
  const [saving, setSaving] = useState(false)
  const [statusBusy, setStatusBusy] = useState<string | null>(null)

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
    imageUrls: campaign?.imageUrls ?? [],
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

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {campaign ? (
          <Badge variant="outline" className={cn("text-[10px]", campaignStatusClass(status))}>
            {campaignStatusLabel(status)}
          </Badge>
        ) : (
          <p className="text-[12px] text-muted-foreground">Rascunho até teres datas e activares.</p>
        )}
        {campaign ? (
          <div className="flex flex-wrap gap-1.5">
            {status !== "live" ? (
              <Button
                type="button"
                size="sm"
                className="h-7 text-[11px]"
                disabled={!!statusBusy}
                onClick={() => void changeStatus("live")}
              >
                {statusBusy === "live" ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                Activar
              </Button>
            ) : null}
            {status !== "scheduled" ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 text-[11px]"
                disabled={!!statusBusy}
                onClick={() => void changeStatus("scheduled")}
              >
                Agendar
              </Button>
            ) : null}
            {status !== "ended" ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 text-[11px]"
                disabled={!!statusBusy}
                onClick={() => void changeStatus("ended")}
              >
                Encerrar
              </Button>
            ) : null}
            {status !== "draft" ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 text-[11px]"
                disabled={!!statusBusy}
                onClick={() => void changeStatus("draft")}
              >
                Rascunho
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="rounded-md border border-border/70 bg-muted/20 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Destino do post / anúncio
        </p>
        <p className="mt-0.5 truncate text-[11px] text-foreground">{previewUrl}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-border/80 bg-card p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Campanha</p>
          <label className="mt-3 block text-[11px] font-medium text-muted-foreground">Nome</label>
          <Input
            value={form.name}
            onChange={(e) => patch("name", e.target.value)}
            placeholder="Semana de salário — 25 a 31 de Agosto"
            className="mt-1 h-8 text-xs"
          />
          <div className="mt-3 grid grid-cols-2 gap-2">
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
              <button
                key={item.id}
                type="button"
                onClick={() => patch("objective", item.id)}
                className={cn(
                  "h-7 rounded-md border px-2 text-[11px]",
                  form.objective === item.id
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-[11px] font-medium text-muted-foreground">Canais</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {CAMPAIGN_CHANNELS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleChannel(item.id)}
                className={cn(
                  "h-7 rounded-md border px-2 text-[11px]",
                  form.channels.includes(item.id)
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-[11px] font-medium text-muted-foreground">Para onde o anúncio manda</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {CAMPAIGN_DESTINATIONS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setDestinationType(item.id)}
                className={cn(
                  "h-7 rounded-md border px-2 text-[11px]",
                  form.destinationType === item.id
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          {form.destinationType === "campaign" ? (
            <>
              <label className="mt-3 block text-[11px] font-medium text-muted-foreground">
                Slug da página (opcional)
              </label>
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
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => patch("pageTheme", item.id)}
                    className={cn(
                      "h-7 rounded-md border px-2 text-[11px]",
                      form.pageTheme === item.id
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-background text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </button>
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
        </section>

        <section className="rounded-lg border border-border/80 bg-card p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            A mesma frase em todo o lado
          </p>
          <label className="mt-3 block text-[11px] font-medium text-muted-foreground">Gancho</label>
          <Input
            value={form.headline}
            onChange={(e) => patch("headline", e.target.value)}
            placeholder="Samsung A16 a 18.900 CVE até sexta"
            className="mt-1 h-8 text-xs"
          />
          <label className="mt-3 block text-[11px] font-medium text-muted-foreground">Hook</label>
          <Input
            value={form.hook}
            onChange={(e) => patch("hook", e.target.value)}
            className="mt-1 h-8 text-xs"
          />
          <label className="mt-3 block text-[11px] font-medium text-muted-foreground">Facebook</label>
          <Textarea
            value={form.facebookPost}
            onChange={(e) => patch("facebookPost", e.target.value)}
            className="mt-1 min-h-[72px] text-xs"
          />
          <label className="mt-3 block text-[11px] font-medium text-muted-foreground">Instagram</label>
          <Textarea
            value={form.instagramCaption}
            onChange={(e) => patch("instagramCaption", e.target.value)}
            className="mt-1 min-h-[72px] text-xs"
          />
          <label className="mt-3 block text-[11px] font-medium text-muted-foreground">WhatsApp</label>
          <Textarea
            value={form.whatsappText}
            onChange={(e) => patch("whatsappText", e.target.value)}
            className="mt-1 min-h-[56px] text-xs"
          />
        </section>
      </div>

      <section className="rounded-lg border border-border/80 bg-card p-4">
        <p className="text-[12px] font-semibold text-foreground">Produtos na página da campanha</p>
        <p className="mt-0.5 text-[12px] text-muted-foreground">
          Estes é que aparecem em /campanha. Pesquisa e escolhe. Depois Guardar.
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
      </section>

      {campaign && (campaign.bannerIds.length || campaign.couponIds.length || campaign.imageUrls.length) ? (
        <section className="rounded-lg border border-border/80 bg-card p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Peças ligadas</p>
          <dl className="mt-2 grid gap-2 text-[11px] sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">Banners</dt>
              <dd className="tabular-nums">{campaign.bannerIds.length}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Cupões</dt>
              <dd className="tabular-nums">{campaign.couponIds.length}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Imagens</dt>
              <dd className="tabular-nums">{campaign.imageUrls.length}</dd>
            </div>
          </dl>
        </section>
      ) : null}

      <section className="rounded-lg border border-border/80 bg-card p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Faixa no topo do site
            </p>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              Aparece em todas as páginas enquanto a campanha estiver live. Sem deploy.
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
              <label className="block text-[11px] font-medium text-muted-foreground">
                CTA secundário
              </label>
              <Input
                value={form.siteTopSecondaryCtaLabel}
                onChange={(e) => patch("siteTopSecondaryCtaLabel", e.target.value)}
                placeholder="Ver ofertas"
                className="mt-1 h-8 text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground">
                Link secundário
              </label>
              <Input
                value={form.siteTopSecondaryCtaHref}
                onChange={(e) => patch("siteTopSecondaryCtaHref", e.target.value)}
                placeholder="/ofertas"
                className="mt-1 h-8 text-xs"
              />
            </div>
          </div>
        ) : null}
      </section>

      <MarketingAdsBriefPanel brief={adsBrief} />

      <div className="flex justify-end">
        <Button type="button" size="sm" className="h-8" disabled={saving || !form.name.trim()} onClick={() => void save()}>
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Guardar
        </Button>
      </div>
    </div>
  )
}
