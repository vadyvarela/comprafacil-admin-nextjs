"use client"

import { useMemo, useRef, useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Check, Copy, ExternalLink, ImageIcon, Loader2, Send, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { showToast } from "@/lib/utils/toast"
import { MARKETING_PLAYBOOKS } from "@/lib/marketing/playbooks"
import { whatsappHref } from "@/lib/marketing/whatsapp"
import {
  campaignStatusClass,
  campaignStatusLabel,
} from "@/lib/marketing/campaigns"
import { AgentMessage } from "@/components/marketing/agent-message"
import type {
  MarketingDesk,
  MarketingImageRecord,
  MarketingProposal,
  MarketingPulse,
} from "@/lib/graphql/marketing/types"
import { cn } from "@/lib/utils"

type FormatKey = "feed" | "stories" | "banner"

const FORMATS: { id: FormatKey; label: string }[] = [
  { id: "feed", label: "Feed" },
  { id: "stories", label: "Stories" },
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
  const facebookPost = live?.facebookPost || offer?.facebookPost || ""
  const instagramCaption = live?.instagramCaption || offer?.instagramCaption || ""
  const whatsappText = live?.whatsappText || offer?.whatsappText || ""
  const waOfferHref = whatsappHref(
    pulse.whatsappNumber,
    whatsappText || `Olá, vi a oferta: ${headline ?? pulse.siteName}`,
  )
  const latestImage =
    desk.latestImages[0] ||
    (live?.imageUrls?.[0]
      ? { url: live.imageUrls[0], format: "feed", prompt: "" }
      : null)

  const pendingProposals = useMemo(
    () => proposals.filter((p) => p.status === "pending"),
    [proposals],
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
      const lastPrompt = data.proposals?.find((p) => p.type === "image_prompt" && p.status === "pending")
      if (lastPrompt && typeof lastPrompt.payload.prompt === "string") {
        setPrompt(lastPrompt.payload.prompt)
        if (lastPrompt.payload.format === "stories" || lastPrompt.payload.format === "banner") {
          setFormat(lastPrompt.payload.format)
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
      const raw = await res.text()
      let data: { error?: string; url?: string; format?: string; prompt?: string } = {}
      try {
        data = raw.trim() ? (JSON.parse(raw) as typeof data) : {}
      } catch {
        throw new Error(`Resposta inválida ao gerar imagem (${res.status}).`)
      }
      if (!res.ok) throw new Error(data.error || `Falha a gerar (${res.status})`)
      if (data.url) {
        const next: MarketingImageRecord = {
          url: data.url,
          format: data.format || format,
          prompt: data.prompt || prompt,
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
      showToast.success(action === "apply" ? data.note || "Na loja" : "Recusado")
      startTransition(() => router.refresh())
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : "Falha")
    } finally {
      setApplyingId(null)
    }
  }

  return (
    <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[minmax(0,1fr)_20.5rem]">
      <section className="flex min-h-0 min-w-0 flex-col border-border lg:border-r">
        <header className="flex h-11 shrink-0 items-center justify-between gap-3 border-b border-border px-4">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold tracking-tight">
              {headline || "Nenhuma campanha na loja"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {live ? (
              <Badge variant="outline" className={cn("h-5 text-[10px]", campaignStatusClass(live.status))}>
                {campaignStatusLabel(live.status)}
              </Badge>
            ) : null}
            {live ? (
              <>
                <Link
                  href={`/dashboard/marketing/campaigns/${live.id}`}
                  className="text-[11px] font-medium text-muted-foreground hover:text-foreground"
                >
                  Editar
                </Link>
                <a
                  href={pulse.campaignUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                >
                  Loja
                  <ExternalLink className="h-3 w-3" />
                </a>
              </>
            ) : null}
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {chat.length === 0 && !busyAgent ? (
            <div className="mx-auto max-w-md pt-10 text-center">
              <p className="text-[13px] font-medium text-foreground">Diz o que queres vender</p>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                O agente sugere. Tu aprovas à direita e copias para o Facebook.
              </p>
            </div>
          ) : (
            <div className="mx-auto flex max-w-2xl flex-col gap-3">
              {chat.map((line, i) => (
                <div
                  key={`${line.role}-${i}`}
                  className={cn(
                    "max-w-[90%] rounded-md px-3 py-2",
                    line.role === "user"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "bg-muted/60 text-foreground",
                  )}
                >
                  {line.role === "assistant" ? (
                    <AgentMessage text={line.content} />
                  ) : (
                    <p className="whitespace-pre-wrap text-[12px] leading-relaxed">{line.content}</p>
                  )}
                </div>
              ))}
              {busyAgent ? (
                <p className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  A preparar…
                </p>
              ) : null}
              <div ref={endRef} />
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-border bg-card p-3">
          <div className="mb-2 flex flex-wrap gap-1">
            {MARKETING_PLAYBOOKS.slice(0, 3).map((book) => (
              <button
                key={book.id}
                type="button"
                disabled={busyAgent}
                onClick={() => sendAgent(book.prompt)}
                className="h-6 rounded border border-border bg-background px-2 text-[11px] text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                {book.label}
              </button>
            ))}
          </div>
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              void sendAgent(draft)
            }}
          >
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ex.: esgota os Samsung esta semana"
              className="min-h-11 max-h-28 resize-none text-[13px]"
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
        </div>
      </section>

      <aside className="flex min-h-0 flex-col overflow-y-auto border-t border-border bg-card lg:border-t-0">
        <div className="border-b border-border px-3 py-2.5">
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-semibold">Aprovar</p>
            <span className="text-[11px] tabular-nums text-muted-foreground">{pendingProposals.length}</span>
          </div>
          {pendingProposals.length === 0 ? (
            <p className="mt-1.5 text-[11px] text-muted-foreground">Nada à espera. Fala com o agente.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {pendingProposals.map((p) => (
                <li key={p.id} className="rounded-md border border-border bg-background px-2.5 py-2">
                  <p className="text-[12px] font-medium leading-snug">{p.title}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{labelForType(p.type)}</p>
                  <div className="mt-2 flex gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      className="h-7 px-2 text-[11px]"
                      disabled={applyingId === p.id || pending}
                      onClick={() => void handleProposal(p.id, "apply")}
                    >
                      {applyingId === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                      Meter na loja
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
                      Não
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-b border-border px-3 py-2.5">
          <p className="text-[12px] font-semibold">Copiar</p>
          <ul className="mt-2 divide-y divide-border rounded-md border border-border">
            <CopyRow label="Facebook" text={facebookPost} onCopy={() => copyText("Facebook", facebookPost)} />
            <CopyRow label="Instagram" text={instagramCaption} onCopy={() => copyText("Instagram", instagramCaption)} />
            <CopyRow
              label="WhatsApp"
              text={whatsappText}
              onCopy={() => copyText("WhatsApp", whatsappText)}
              href={waOfferHref}
            />
            <CopyRow label="Link" text={pulse.campaignUrl} onCopy={() => copyText("Link", pulse.campaignUrl)} mono />
          </ul>
        </div>

        <div className="px-3 py-2.5">
          <p className="text-[12px] font-semibold">Imagem</p>
          {latestImage ? (
            <a
              href={latestImage.url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 block overflow-hidden rounded-md border border-border"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={latestImage.url} alt="" className="aspect-square w-full object-cover" />
            </a>
          ) : (
            <p className="mt-1.5 text-[11px] text-muted-foreground">Ainda sem imagem desta campanha.</p>
          )}
          <div className="mt-2 flex gap-1">
            {FORMATS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFormat(item.id)}
                className={cn(
                  "h-6 rounded border px-2 text-[11px]",
                  format === item.id
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Prompt — o agente preenche"
            className="mt-2 min-h-16 text-[12px]"
          />
          <Button
            type="button"
            size="sm"
            className="mt-2 h-8 w-full"
            disabled={busyImage || !prompt.trim()}
            onClick={() => void generateImage()}
          >
            {busyImage ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
            {busyImage ? "A gerar…" : "Gerar"}
          </Button>
        </div>
      </aside>
    </div>
  )
}

function labelForType(type: string) {
  const map: Record<string, string> = {
    campaign: "Campanha",
    campaign_attach: "Ligar à campanha",
    weekly_offer: "Oferta",
    social_pack: "Textos redes",
    banner: "Banner",
    coupon: "Cupão",
    product_merch: "Produto",
    image_prompt: "Prompt de imagem",
  }
  return map[type] ?? type
}

function CopyRow({
  label,
  text,
  onCopy,
  href,
  mono,
}: {
  label: string
  text: string
  onCopy: () => void
  href?: string | null
  mono?: boolean
}) {
  return (
    <li className="flex items-start gap-2 px-2.5 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={cn("mt-0.5 line-clamp-2 text-[11px] leading-snug text-foreground", mono && "font-mono")}>
          {text.trim() || "—"}
        </p>
        {href ? (
          <a href={href} target="_blank" rel="noreferrer" className="mt-1 inline-block text-[10px] text-primary hover:underline">
            Abrir WhatsApp
          </a>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onCopy}
        className="mt-0.5 text-muted-foreground hover:text-foreground"
        aria-label={`Copiar ${label}`}
      >
        <Copy className="h-3.5 w-3.5" />
      </button>
    </li>
  )
}
