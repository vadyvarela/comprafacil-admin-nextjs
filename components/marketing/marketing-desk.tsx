"use client"

import { useMemo, useRef, useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  Copy,
  ImageIcon,
  Loader2,
  Send,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { showToast } from "@/lib/utils/toast"
import { formatCurrency } from "@/lib/utils/currency"
import { MARKETING_PLAYBOOKS } from "@/lib/marketing/playbooks"
import { formatWhatsappDisplay, whatsappHref } from "@/lib/marketing/whatsapp"
import {
  campaignStatusClass,
  campaignStatusLabel,
  formatCampaignRange,
} from "@/lib/marketing/campaigns"
import { buildMarketingAdsBrief } from "@/lib/marketing/ads-brief"
import { MarketingAdsBriefPanel } from "@/components/marketing/marketing-ads-brief"
import type {
  MarketingDesk,
  MarketingImageRecord,
  MarketingProposal,
  MarketingPulse,
} from "@/lib/graphql/marketing/types"
import { cn } from "@/lib/utils"

type FormatKey = "feed" | "stories" | "banner"

const FORMATS: { id: FormatKey; label: string }[] = [
  { id: "feed", label: "Feed 1:1" },
  { id: "stories", label: "Stories 9:16" },
  { id: "banner", label: "Banner" },
]

type ChatLine = { role: "user" | "assistant"; content: string }

export function MarketingDesk({ pulse }: { pulse: MarketingPulse }) {
  const router = useRouter()
  const [threadId, setThreadId] = useState<string | null>(null)
  const [chat, setChat] = useState<ChatLine[]>([])
  const [draft, setDraft] = useState("")
  const [prompt, setPrompt] = useState("")
  const [format, setFormat] = useState<FormatKey>("feed")
  const [proposals, setProposals] = useState(pulse.proposals)
  const [desk, setDesk] = useState<MarketingDesk>(pulse.desk)
  const [busyAgent, setBusyAgent] = useState(false)
  const [busyImage, setBusyImage] = useState(false)
  const [applyingId, setApplyingId] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const endRef = useRef<HTMLDivElement>(null)
  const live = pulse.liveCampaign

  useEffect(() => {
    setDesk(pulse.desk)
    setProposals(pulse.proposals)
  }, [pulse])

  const offer = desk.weeklyOffer
  const headline = live?.headline || live?.name || offer?.headline
  const hook = live?.hook || offer?.hook
  const facebookPost = live?.facebookPost || offer?.facebookPost || ""
  const instagramCaption = live?.instagramCaption || offer?.instagramCaption || ""
  const whatsappText = live?.whatsappText || offer?.whatsappText || ""
  const revenueDelta = pulse.revenueThisWeek - pulse.revenueLastWeek
  const revenueUp = revenueDelta >= 0
  const waOfferHref = whatsappHref(
    pulse.whatsappNumber,
    whatsappText || `Olá, vi a oferta: ${headline ?? pulse.siteName}`,
  )

  const pendingProposals = useMemo(
    () => proposals.filter((p) => p.status === "pending"),
    [proposals],
  )

  const adsBrief = useMemo(
    () =>
      buildMarketingAdsBrief({
        campaign: live,
        offerHeadline: headline,
        facebookPost,
        instagramCaption,
        imageUrls: desk.latestImages.map((img) => img.url),
        metaPixelId: pulse.metaPixelId,
      }),
    [live, headline, facebookPost, instagramCaption, desk.latestImages, pulse.metaPixelId],
  )

  async function copyText(label: string, text: string) {
    if (!text.trim()) {
      showToast.info("Ainda não há texto para copiar")
      return
    }
    await navigator.clipboard.writeText(text)
    showToast.success(`${label} copiado`)
  }

  async function sendAgent(text: string) {
    const message = text.trim()
    if (!message || busyAgent) return
    setDraft("")
    setChat((prev) => [...prev, { role: "user", content: message }])
    setBusyAgent(true)
    try {
      const res = await fetch("/api/marketing/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, threadId }),
      })
      const data = (await res.json()) as {
        error?: string
        reply?: string
        threadId?: string
        proposals?: MarketingProposal[]
        desk?: MarketingDesk
      }
      if (!res.ok) throw new Error(data.error || "Falha no agente")
      if (data.threadId) setThreadId(data.threadId)
      setChat((prev) => [...prev, { role: "assistant", content: data.reply || "" }])
      if (data.proposals) setProposals(data.proposals)
      if (data.desk) setDesk(data.desk)
      if (typeof data.reply === "string" && data.reply.toLowerCase().includes("prompt")) {
        const lastPrompt = data.proposals?.find((p) => p.type === "image_prompt")
        if (lastPrompt && typeof lastPrompt.payload.prompt === "string") {
          setPrompt(lastPrompt.payload.prompt)
          if (lastPrompt.payload.format === "stories" || lastPrompt.payload.format === "banner") {
            setFormat(lastPrompt.payload.format)
          }
        }
      }
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : "Falha no agente")
    } finally {
      setBusyAgent(false)
      queueMicrotask(() => endRef.current?.scrollIntoView({ behavior: "smooth" }))
    }
  }

  async function generateImage() {
    if (!prompt.trim() || busyImage) return
    setBusyImage(true)
    try {
      const res = await fetch("/api/marketing/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, format }),
      })
      const data = (await res.json()) as { error?: string; url?: string; format?: string; prompt?: string }
      if (!res.ok) throw new Error(data.error || "Falha a gerar")
      if (data.url) {
        const next: MarketingImageRecord = {
          url: data.url,
          format: data.format || format,
          prompt: data.prompt || prompt,
          createdAt: new Date().toISOString(),
        }
        setDesk((prev) => ({ ...prev, latestImages: [next, ...prev.latestImages] }))
        showToast.success("Imagem gerada e guardada na biblioteca")
      }
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : "Falha a gerar imagem")
    } finally {
      setBusyImage(false)
    }
  }

  async function handleProposal(id: string, action: "apply" | "reject") {
    setApplyingId(id)
    try {
      const res = await fetch(`/api/marketing/proposals/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      const data = (await res.json()) as { error?: string; note?: string }
      if (!res.ok) throw new Error(data.error || "Falha")
      setProposals((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: action === "apply" ? "applied" : "rejected" } : p)),
      )
      showToast.success(action === "apply" ? data.note || "Aplicado" : "Rejeitado")
      startTransition(() => router.refresh())
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : "Falha")
    } finally {
      setApplyingId(null)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-5">
      <div className="flex flex-wrap gap-1.5">
        {MARKETING_PLAYBOOKS.map((book) => (
          <Button
            key={book.id}
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-[11px]"
            disabled={busyAgent}
            onClick={() => sendAgent(book.prompt)}
          >
            {book.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div className="flex min-h-0 flex-col gap-4">
          <section className="rounded-lg border border-border/80 bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {live ? "Campanha live" : "Oferta da semana"}
                </p>
                <h2 className="mt-1 text-sm font-semibold tracking-tight text-foreground">
                  {headline || "Ainda não definida"}
                </h2>
                {hook ? (
                  <p className="mt-1 text-[12px] text-muted-foreground">{hook}</p>
                ) : (
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    Pede ao agente uma campanha da semana — a mesma frase no site, Facebook e Instagram.
                  </p>
                )}
                {live ? (
                  <Link
                    href={`/dashboard/marketing/campaigns/${live.id}`}
                    className="mt-1.5 inline-block text-[11px] font-medium text-primary hover:underline"
                  >
                    {live.name} · {formatCampaignRange(live)}
                  </Link>
                ) : null}
              </div>
              {live ? (
                <Badge variant="outline" className={cn("text-[10px]", campaignStatusClass(live.status))}>
                  {campaignStatusLabel(live.status)}
                </Badge>
              ) : offer?.endsAt ? (
                <Badge variant="secondary" className="text-[10px]">
                  até {offer.endsAt}
                </Badge>
              ) : null}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <CopyBlock
                label="Facebook"
                text={facebookPost}
                onCopy={() => copyText("Facebook", facebookPost)}
              />
              <CopyBlock
                label="Instagram"
                text={instagramCaption}
                onCopy={() => copyText("Instagram", instagramCaption)}
              />
              <CopyBlock
                label="WhatsApp"
                text={whatsappText}
                onCopy={() => copyText("WhatsApp", whatsappText)}
                href={waOfferHref}
              />
            </div>
            <div className="mt-2 rounded-md border border-border/70 bg-muted/20 px-2.5 py-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Destino do post / anúncio
                </p>
                <button
                  type="button"
                  onClick={() => void copyText("Link", pulse.campaignUrl)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Copiar link da campanha"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
              <p className="mt-1 truncate text-[11px] text-foreground">{pulse.campaignUrl}</p>
            </div>
          </section>

          <section className="flex min-h-[380px] flex-1 flex-col rounded-lg border border-border/80 bg-card">
            <div className="border-b border-border px-4 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Agente
              </p>
              <p className="text-[11px] text-muted-foreground">Sugere. Tu aprovas à direita.</p>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-3">
              {chat.length === 0 ? (
                <p className="text-[12px] leading-relaxed text-muted-foreground">
                  Ex.: «esgota os Samsung esta semana» ou usa um atalho em cima. O agente não publica sozinho.
                </p>
              ) : (
                chat.map((line, i) => (
                  <div
                    key={`${line.role}-${i}`}
                    className={cn(
                      "max-w-[92%] rounded-md px-3 py-2 text-[12px] leading-relaxed",
                      line.role === "user"
                        ? "ml-auto bg-primary text-primary-foreground"
                        : "bg-muted/70 text-foreground",
                    )}
                  >
                    {line.content}
                  </div>
                ))
              )}
              {busyAgent ? (
                <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  A trabalhar no catálogo…
                </p>
              ) : null}
              <div ref={endRef} />
            </div>
            <form
              className="flex items-end gap-2 border-t border-border p-3"
              onSubmit={(e) => {
                e.preventDefault()
                void sendAgent(draft)
              }}
            >
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Instrução para o agente…"
                className="min-h-[44px] max-h-28 resize-none text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    void sendAgent(draft)
                  }
                }}
              />
              <Button type="submit" size="sm" className="h-9 px-3" disabled={busyAgent || !draft.trim()}>
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>
          </section>
        </div>

        <div className="flex flex-col gap-4">
          <section className="rounded-lg border border-border/80 bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Vendas · 7 dias
              </p>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px]",
                  pulse.metaPixelId
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-amber-200 bg-amber-50 text-amber-900",
                )}
              >
                {pulse.metaPixelId ? "Pixel OK" : "Sem pixel"}
              </Badge>
            </div>
            <div className="mt-2 flex items-end justify-between gap-3">
              <div>
                <p className="text-lg font-semibold tabular-nums tracking-tight">
                  {formatCurrency(pulse.revenueThisWeek)}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {pulse.ordersThisWeek.toLocaleString("pt-PT")} un. · vs {formatCurrency(pulse.revenueLastWeek)}
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 text-[11px] font-medium",
                  revenueUp ? "text-emerald-700" : "text-rose-700",
                )}
              >
                {revenueUp ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                {formatCurrency(Math.abs(revenueDelta))}
              </span>
            </div>
            <ul className="mt-3 space-y-1.5">
              {pulse.topProducts.length === 0 ? (
                <li className="text-[11px] text-muted-foreground">Sem vendas neste período.</li>
              ) : (
                pulse.topProducts.map((p) => (
                  <li key={p.productId} className="flex justify-between gap-2 text-[11px]">
                    <span className="truncate text-foreground">{p.productTitle}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">{p.totalSold} un.</span>
                  </li>
                ))
              )}
            </ul>
          </section>

          <MarketingAdsBriefPanel brief={adsBrief} />

          <section className="rounded-lg border border-border/80 bg-card p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Live na loja
            </p>
            <ul className="mt-2 space-y-1.5">
              {pulse.liveBanners.length === 0 ? (
                <li className="text-[11px] text-muted-foreground">Nenhum banner activo.</li>
              ) : (
                pulse.liveBanners.map((b) => (
                  <li key={b.id} className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="truncate">{b.title}</span>
                    <span className="shrink-0 text-muted-foreground">{b.position ?? "hero"}</span>
                  </li>
                ))
              )}
            </ul>
            <p className="mt-2 text-[11px] text-muted-foreground">
              WhatsApp loja: {formatWhatsappDisplay(pulse.whatsappNumber)}
            </p>
          </section>

          <section className="rounded-lg border border-border/80 bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Aplicar
              </p>
              <span className="text-[10px] tabular-nums text-muted-foreground">
                {pendingProposals.length} pendente{pendingProposals.length === 1 ? "" : "s"}
              </span>
            </div>
            <ul className="mt-2 space-y-2">
              {pendingProposals.length === 0 ? (
                <li className="text-[11px] text-muted-foreground">Nada para aprovar.</li>
              ) : (
                pendingProposals.map((p) => (
                  <li key={p.id} className="rounded-md border border-border/70 bg-muted/30 px-2.5 py-2">
                    <p className="text-[11px] font-medium text-foreground">{p.title}</p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {labelForType(p.type)}
                    </p>
                    <div className="mt-2 flex gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        className="h-7 px-2 text-[11px]"
                        disabled={applyingId === p.id || pending}
                        onClick={() => void handleProposal(p.id, "apply")}
                      >
                        {applyingId === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                        Aplicar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-[11px]"
                        disabled={applyingId === p.id}
                        onClick={() => void handleProposal(p.id, "reject")}
                      >
                        <X className="h-3 w-3" />
                        Rejeitar
                      </Button>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="rounded-lg border border-border/80 bg-card p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Gerar imagem
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {FORMATS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFormat(item.id)}
                  className={cn(
                    "h-7 rounded-md border px-2 text-[11px]",
                    format === item.id
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Prompt da campanha…"
              className="mt-2 min-h-[72px] text-xs"
            />
            <Button
              type="button"
              size="sm"
              className="mt-2 h-8 w-full"
              disabled={busyImage || !prompt.trim()}
              onClick={() => void generateImage()}
            >
              {busyImage ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
              {busyImage ? "A gerar…" : "Gerar e guardar"}
            </Button>
            {desk.latestImages[0] ? (
              <a
                href={desk.latestImages[0].url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 block overflow-hidden rounded-md border border-border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={desk.latestImages[0].url}
                  alt=""
                  className="aspect-square max-h-48 w-full object-cover"
                />
              </a>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  )
}

function labelForType(type: string) {
  const map: Record<string, string> = {
    campaign: "Campanha",
    campaign_attach: "Ligar à campanha",
    weekly_offer: "Oferta da semana",
    social_pack: "Pack redes",
    banner: "Banner",
    coupon: "Cupão",
    product_merch: "Produto",
    image_prompt: "Prompt de imagem",
  }
  return map[type] ?? type
}

function CopyBlock({
  label,
  text,
  onCopy,
  href,
}: {
  label: string
  text: string
  onCopy: () => void
  href?: string | null
}) {
  return (
    <div className="rounded-md border border-border/70 bg-muted/20 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <button
          type="button"
          onClick={onCopy}
          className="text-muted-foreground hover:text-foreground"
          aria-label={`Copiar ${label}`}
        >
          <Copy className="h-3 w-3" />
        </button>
      </div>
      <p className="mt-1 line-clamp-3 text-[11px] leading-relaxed text-foreground">
        {text.trim() || "—"}
      </p>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="mt-1.5 inline-block text-[10px] font-medium text-primary hover:underline"
        >
          Abrir conversa
        </a>
      ) : null}
    </div>
  )
}
