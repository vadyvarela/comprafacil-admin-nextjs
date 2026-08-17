"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useApolloClient } from "@apollo/client/react"
import { ImageIcon, Loader2, Send, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { showToast } from "@/lib/utils/toast"
import { MARKETING_CAMPAIGN_PLAYBOOKS } from "@/lib/marketing/playbooks"
import { whatsappHref } from "@/lib/marketing/whatsapp"
import { formatCampaignRange } from "@/lib/marketing/campaigns"
import { AgentMessage } from "@/components/marketing/agent-message"
import { MarketingPostPreview } from "@/components/marketing/marketing-post-preview"
import { GET_PRODUCT } from "@/lib/graphql/products/queries"
import type { MarketingDesk, MarketingImageRecord, MarketingProposal, MarketingPulse } from "@/lib/graphql/marketing/types"
import { cn } from "@/lib/utils"

type ChatLine = { role: "user" | "assistant"; content: string }
type ProductThumb = { id: string; title: string; image?: string | null }

function asString(value: unknown) {
  return typeof value === "string" ? value : ""
}

function asStringList(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === "string" && !!item.trim())
}

export function MarketingCampaignStudio({ pulse }: { pulse: MarketingPulse }) {
  const router = useRouter()
  const [threadId, setThreadId] = useState<string | null>(null)
  const [chat, setChat] = useState<ChatLine[]>([])
  const [draft, setDraft] = useState("")
  const [proposals, setProposals] = useState(pulse.proposals)
  const [desk, setDesk] = useState<MarketingDesk>(pulse.desk)
  const [busyAgent, setBusyAgent] = useState(false)
  const [busyImage, setBusyImage] = useState(false)
  const [applying, setApplying] = useState(false)
  const [productIds, setProductIds] = useState<string[]>([])
  const [products, setProducts] = useState<ProductThumb[]>([])
  const [previewChannel, setPreviewChannel] = useState<"facebook" | "instagram">("facebook")
  const endRef = useRef<HTMLDivElement>(null)

  const campaignProposal = useMemo(
    () => proposals.find((p) => p.status === "pending" && p.type === "campaign") ?? null,
    [proposals],
  )
  const imageProposal = useMemo(
    () => proposals.find((p) => p.status === "pending" && p.type === "image_prompt") ?? null,
    [proposals],
  )

  const payload = campaignProposal?.payload ?? {}
  const name = asString(payload.name) || campaignProposal?.title || ""
  const headline = asString(payload.headline) || name
  const hook = asString(payload.hook)
  const facebookPost = asString(payload.facebookPost)
  const instagramCaption = asString(payload.instagramCaption)
  const whatsappText = asString(payload.whatsappText)
  const imagePrompt = asString(imageProposal?.payload.prompt)
  const latestImage = desk.latestImages[0] ?? null
  const range = formatCampaignRange({
    startDate: asString(payload.startDate) || null,
    endDate: asString(payload.endDate) || null,
  })
  const waHref = whatsappHref(
    pulse.whatsappNumber,
    whatsappText || `Olá, vi a oferta: ${headline || pulse.siteName}`,
  )

  useEffect(() => {
    setDesk(pulse.desk)
    setProposals(pulse.proposals)
  }, [pulse])

  useEffect(() => {
    if (!campaignProposal) return
    const ids = asStringList(campaignProposal.payload.productIds).slice(0, 3)
    setProductIds(ids)
  }, [campaignProposal?.id])

  useEffect(() => {
    queueMicrotask(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }))
  }, [chat, busyAgent])

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
        body: JSON.stringify({ message, threadId, intent: "campaign" }),
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
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : "Falha no agente")
    } finally {
      setBusyAgent(false)
    }
  }

  async function generateImage() {
    if (!imagePrompt.trim() || busyImage) return
    setBusyImage(true)
    try {
      const res = await fetch("/api/marketing/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: imagePrompt, format: "feed" }),
      })
      const data = (await res.json()) as { error?: string; url?: string; format?: string; prompt?: string }
      if (!res.ok) throw new Error(data.error || "Falha a gerar")
      if (data.url) {
        const next: MarketingImageRecord = {
          url: data.url,
          format: data.format || "feed",
          prompt: data.prompt || imagePrompt,
          createdAt: new Date().toISOString(),
        }
        setDesk((prev) => ({ ...prev, latestImages: [next, ...prev.latestImages] }))
        showToast.success("Imagem pronta")
      }
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : "Falha a gerar imagem")
    } finally {
      setBusyImage(false)
    }
  }

  async function putInStore() {
    if (!campaignProposal || applying) return
    setApplying(true)
    try {
      const res = await fetch(`/api/marketing/proposals/${campaignProposal.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "apply" }),
      })
      const data = (await res.json()) as { error?: string; note?: string; campaignId?: string | null }
      if (!res.ok) throw new Error(data.error || "Falha")
      const campaignId = data.campaignId
      if (campaignId) {
        const patch: Record<string, unknown> = {}
        if (productIds.length) patch.productIds = productIds
        if (latestImage?.url) patch.imageUrls = [latestImage.url]
        if (Object.keys(patch).length) {
          await fetch(`/api/marketing/campaigns/${campaignId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patch),
          })
        }
        showToast.success(data.note || "Na loja")
        router.push(`/dashboard/marketing/campaigns/${campaignId}`)
        return
      }
      showToast.success(data.note || "Campanha criada")
      router.push("/dashboard/marketing/campaigns")
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : "Falha")
    } finally {
      setApplying(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
      <section className="flex min-h-0 min-w-0 flex-1 flex-col max-lg:max-h-[48%] lg:max-h-none">
        <header className="flex h-10 shrink-0 items-center border-b border-border px-3">
          <p className="text-[13px] font-medium">O que queres vender?</p>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {chat.length === 0 && !busyAgent ? (
            <div className="mx-auto flex max-w-lg flex-col gap-1 px-4 py-6">
              <p className="text-[13px] font-medium">Estúdio da campanha</p>
              <p className="mb-2 text-[12px] leading-relaxed text-muted-foreground">
                O agente monta o post, os produtos e a página /campanha. Tu copias para o Facebook ou metes na loja.
              </p>
              {MARKETING_CAMPAIGN_PLAYBOOKS.map((book) => (
                <button
                  key={book.id}
                  type="button"
                  disabled={busyAgent}
                  onClick={() => void sendAgent(book.prompt)}
                  className="rounded-md border border-border px-3 py-2 text-left text-[13px] hover:bg-muted/60 disabled:opacity-50"
                >
                  {book.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="mx-auto flex max-w-2xl flex-col gap-2.5 px-4 py-4">
              {chat.map((line, i) => (
                <div
                  key={`${line.role}-${i}`}
                  className={cn(
                    "max-w-[92%] rounded-md px-3 py-2",
                    line.role === "user"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "bg-muted/70 text-foreground",
                  )}
                >
                  {line.role === "assistant" ? (
                    <AgentMessage text={line.content} />
                  ) : (
                    <p className="whitespace-pre-wrap text-[13px] leading-relaxed">{line.content}</p>
                  )}
                </div>
              ))}
              {busyAgent ? (
                <p className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  A montar a campanha…
                </p>
              ) : null}
              <div ref={endRef} />
            </div>
          )}
        </div>
        <form
          className="flex shrink-0 items-center gap-2 border-t border-border bg-background px-3 py-2"
          onSubmit={(e) => {
            e.preventDefault()
            void sendAgent(draft)
          }}
        >
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ex.: Samsung A16 esta semana"
            className="h-9 text-[13px]"
            disabled={busyAgent}
            autoComplete="off"
          />
          <Button type="submit" size="sm" className="h-9 px-3" disabled={busyAgent || !draft.trim()}>
            <Send className="h-3.5 w-3.5" />
          </Button>
        </form>
      </section>

      <aside className="flex min-h-0 w-full shrink-0 flex-col overflow-hidden border-t border-border lg:w-[22rem] lg:border-l lg:border-t-0">
        <header className="flex h-10 shrink-0 items-center justify-between border-b border-border px-3">
          <p className="text-[13px] font-medium">Pack de venda</p>
          {campaignProposal ? (
            <span className="text-[11px] text-muted-foreground">{range}</span>
          ) : null}
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {busyAgent && !campaignProposal ? (
            <p className="text-[12px] text-muted-foreground">A montar o post…</p>
          ) : !campaignProposal ? (
            <p className="text-[12px] leading-relaxed text-muted-foreground">
              O pack aparece aqui: post Facebook, produtos e o que vai para /campanha.
            </p>
          ) : (
            <div className="space-y-3">
              <MarketingPostPreview
                siteName={pulse.siteName}
                imageUrl={latestImage?.url}
                caption={previewChannel === "facebook" ? facebookPost : instagramCaption}
                channel={previewChannel}
                onChannel={setPreviewChannel}
              />
              {!latestImage ? (
                <Button
                  type="button"
                  size="sm"
                  className="h-7 w-full text-[11px]"
                  disabled={busyImage || !imagePrompt.trim()}
                  onClick={() => void generateImage()}
                >
                  {busyImage ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImageIcon className="h-3 w-3" />}
                  Gerar imagem
                </Button>
              ) : null}
              <div className="flex flex-wrap gap-1">
                <CopyBtn label="Facebook" onClick={() => void copyText("Facebook", facebookPost)} />
                <CopyBtn label="Instagram" onClick={() => void copyText("Instagram", instagramCaption)} />
                <CopyBtn label="WhatsApp" onClick={() => void copyText("WhatsApp", whatsappText)} />
                {waHref ? (
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noreferrer"
                    className="h-6 rounded border border-border px-2 text-[11px] leading-6 text-muted-foreground hover:text-foreground"
                  >
                    Abrir WA
                  </a>
                ) : null}
              </div>

              <div className="rounded-md border border-border p-2.5">
                <p className="text-[11px] font-medium text-muted-foreground">Na loja · /campanha</p>
                <p className="mt-1 text-[13px] font-medium leading-snug">{headline || "—"}</p>
                {hook ? <p className="mt-0.5 text-[12px] text-muted-foreground">{hook}</p> : null}
                <StudioProducts
                  ids={productIds}
                  products={products}
                  onProducts={setProducts}
                  onRemove={(id) => setProductIds((prev) => prev.filter((item) => item !== id))}
                />
              </div>
            </div>
          )}
        </div>
        {campaignProposal ? (
          <div className="flex shrink-0 items-center gap-2 border-t border-border px-3 py-2">
            <Button type="button" size="sm" className="h-8 flex-1" disabled={applying} onClick={() => void putInStore()}>
              {applying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Meter na loja
            </Button>
            {latestImage ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8"
                disabled={busyImage || !imagePrompt.trim()}
                onClick={() => void generateImage()}
              >
                Nova imagem
              </Button>
            ) : null}
          </div>
        ) : null}
      </aside>
    </div>
  )
}

function CopyBtn({ label, onClick }: { label: string; onClick: () => void }) {
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

function StudioProducts({
  ids,
  products,
  onProducts,
  onRemove,
}: {
  ids: string[]
  products: ProductThumb[]
  onProducts: (rows: ProductThumb[]) => void
  onRemove: (id: string) => void
}) {
  const client = useApolloClient()

  useEffect(() => {
    if (ids.length === 0) {
      onProducts([])
      return
    }
    let cancelled = false
    void (async () => {
      const rows = await Promise.all(
        ids.map(async (id) => {
          const existing = products.find((p) => p.id === id)
          if (existing) return existing
          try {
            const result = await client.query<{
              productDetails: { id: string; title: string; image?: string | null } | null
            }>({
              query: GET_PRODUCT,
              variables: { id },
              fetchPolicy: "cache-first",
            })
            const row = result.data?.productDetails
            return {
              id,
              title: row?.title || id.slice(0, 8),
              image: row?.image ?? null,
            }
          } catch {
            return { id, title: id.slice(0, 8), image: null }
          }
        }),
      )
      if (!cancelled) onProducts(rows)
    })()
    return () => {
      cancelled = true
    }
  }, [ids.join("|")])

  if (ids.length === 0) {
    return <p className="mt-2 text-[12px] text-muted-foreground">Sem produtos ainda.</p>
  }

  return (
    <ul className="mt-2 space-y-1.5">
      {ids.map((id) => {
        const row = products.find((p) => p.id === id)
        return (
          <li key={id} className="flex items-center gap-2">
            {row?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={row.image} alt="" className="h-8 w-8 rounded object-cover" />
            ) : (
              <span className="h-8 w-8 rounded bg-muted" />
            )}
            <span className="min-w-0 flex-1 truncate text-[12px]">{row?.title || "…"}</span>
            <button
              type="button"
              onClick={() => onRemove(id)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Tirar produto"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </li>
        )
      })}
    </ul>
  )
}
