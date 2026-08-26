"use client"

import { useMemo, useRef, useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  CalendarRange,
  Check,
  Copy,
  ExternalLink,
  ImageIcon,
  Loader2,
  PanelRight,
  Send,
  Store,
  Target,
  TrendingUp,
  type LucideIcon,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { showToast } from "@/lib/utils/toast"
import { MARKETING_PLAYBOOKS } from "@/lib/marketing/playbooks"
import { whatsappHref } from "@/lib/marketing/whatsapp"
import { campaignStatusClass, campaignStatusLabel, formatCampaignRange } from "@/lib/marketing/campaigns"
import { AgentMessage } from "@/components/marketing/agent-message"
import { MarketingPostPreview } from "@/components/marketing/marketing-post-preview"
import type { MarketingDesk, MarketingImageRecord, MarketingProposal, MarketingPulse } from "@/lib/graphql/marketing/types"
import { formatCurrency } from "@/lib/utils/currency"
import { cn } from "@/lib/utils"

type FormatKey = "feed" | "stories" | "banner"
type RailTab = "publicar" | "aprovar"

const FORMATS: { id: FormatKey; label: string }[] = [
  { id: "feed", label: "Feed" },
  { id: "stories", label: "Stories" },
  { id: "banner", label: "Banner" },
]

type ChatLine = { role: "user" | "assistant"; content: string }

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function asStringList(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === "string" && !!item.trim())
}

function campaignProposalRange(proposal: MarketingProposal) {
  return formatCampaignRange({
    startDate: asString(proposal.payload.startDate) || null,
    endDate: asString(proposal.payload.endDate) || null,
  })
}

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
  const [railTab, setRailTab] = useState<RailTab>("publicar")
  const [railOpen, setRailOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const endRef = useRef<HTMLDivElement>(null)
  const live = pulse.liveCampaign

  useEffect(() => {
    setDesk(pulse.desk)
    setProposals(pulse.proposals)
  }, [pulse])

  const offer = desk.weeklyOffer
  const headline = live?.headline || live?.name || offer?.headline
  const pendingProposals = useMemo(
    () => proposals.filter((p) => p.status === "pending"),
    [proposals],
  )
  const pendingCampaign = pendingProposals.find((p) => p.type === "campaign")
  const pendingCopy = pendingProposals.find(
    (p) =>
      typeof p.payload.facebookPost === "string" || typeof p.payload.instagramCaption === "string",
  )
  const facebookPost =
    (typeof pendingCopy?.payload.facebookPost === "string" && pendingCopy.payload.facebookPost) ||
    live?.facebookPost ||
    offer?.facebookPost ||
    ""
  const instagramCaption =
    (typeof pendingCopy?.payload.instagramCaption === "string" &&
      pendingCopy.payload.instagramCaption) ||
    live?.instagramCaption ||
    offer?.instagramCaption ||
    ""
  const whatsappText =
    (typeof pendingCopy?.payload.whatsappText === "string" && pendingCopy.payload.whatsappText) ||
    live?.whatsappText ||
    offer?.whatsappText ||
    ""
  const waOfferHref = whatsappHref(
    pulse.whatsappNumber,
    whatsappText || `Olá, vi a oferta: ${headline ?? pulse.siteName}`,
  )
  const latestImage =
    desk.latestImages[0] ||
    (live?.imageUrls?.[0] ? { url: live.imageUrls[0], format: "feed", prompt: "" } : null)

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
        body: JSON.stringify({ message, threadId, intent: "desk" }),
      })
      const data = (await res.json()) as {
        error?: string
        reply?: string
        threadId?: string
        messages?: Array<{ role: "user" | "assistant"; content: string }>
        proposals?: MarketingProposal[]
        pack?: {
          proposal: MarketingProposal | null
          imagePrompt: string
          imageUrl: string | null
        }
        desk?: MarketingDesk
      }
      if (!res.ok) throw new Error(data.error || "Falha no agente")
      if (data.threadId) setThreadId(data.threadId)
      if (data.messages?.length) {
        setChat(data.messages)
      } else {
        setChat((prev) => [...prev, { role: "assistant", content: data.reply || "" }])
      }
      if (data.proposals) setProposals(data.proposals)
      if (data.desk) setDesk(data.desk)
      const packProposal = data.pack?.proposal
      const hasCampaignProposal =
        packProposal?.type === "campaign" ||
        data.proposals?.some((p) => p.type === "campaign" && p.status === "pending")
      const lastPrompt =
        data.pack?.imagePrompt ||
        (typeof data.proposals?.find((p) => p.type === "image_prompt" && p.status === "pending")?.payload.prompt ===
        "string"
          ? (data.proposals.find((p) => p.type === "image_prompt" && p.status === "pending")?.payload.prompt as string)
          : "")
      const lastPack =
        packProposal &&
        (packProposal.type === "social_pack" ||
          (typeof packProposal.payload.facebookPost === "string" && packProposal.payload.facebookPost.trim()))
          ? packProposal
          : data.proposals?.find(
              (p) =>
                p.status === "pending" &&
                (p.type === "social_pack" ||
                  (typeof p.payload.facebookPost === "string" && p.payload.facebookPost.trim())),
            )
      if (lastPrompt) {
        setPrompt(lastPrompt)
        const format = packProposal?.payload.format
        if (format === "stories" || format === "banner") {
          setFormat(format)
        } else {
          setFormat("feed")
        }
      }
      if (hasCampaignProposal) {
        setRailTab("aprovar")
      } else if (lastPack || lastPrompt) {
        setRailTab("publicar")
      } else if (data.proposals?.some((p) => p.status === "pending")) {
        setRailTab("aprovar")
      }
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : "Falha no agente")
    } finally {
      setBusyAgent(false)
      queueMicrotask(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }))
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

  const rail = (
    <DeskRail
      tab={railTab}
      onTab={setRailTab}
      siteName={pulse.siteName}
      pendingProposals={pendingProposals}
      campaignProposal={pendingCampaign}
      applyingId={applyingId}
      pending={pending}
      onProposal={handleProposal}
      facebookPost={facebookPost}
      instagramCaption={instagramCaption}
      whatsappText={whatsappText}
      campaignUrl={pulse.campaignUrl}
      waOfferHref={waOfferHref}
      onCopy={copyText}
      hasDraftCopy={Boolean(pendingCopy)}
      latestImage={latestImage}
      format={format}
      onFormat={setFormat}
      prompt={prompt}
      onPrompt={setPrompt}
      busyImage={busyImage}
      onGenerate={() => void generateImage()}
    />
  )

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <section className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border px-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase text-muted-foreground">
              Departamento de marketing
            </p>
            <p className="truncate text-[13px] font-medium">
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
              <Link
                href={`/dashboard/marketing/campaigns/${live.id}`}
                className="text-[12px] text-muted-foreground hover:text-foreground"
              >
                Editar
              </Link>
            ) : null}
            {live ? (
              <a
                href={pulse.campaignUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground"
              >
                Loja
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : null}
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-[12px] text-muted-foreground hover:text-foreground lg:hidden"
              onClick={() => setRailOpen(true)}
            >
              <PanelRight className="h-3.5 w-3.5" />
              {pendingProposals.length > 0 ? pendingProposals.length : "Publicar"}
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {chat.length === 0 && !busyAgent ? (
            <DepartmentStart
              pulse={pulse}
              live={live}
              pendingCampaign={pendingCampaign}
              busyAgent={busyAgent}
              applyingId={applyingId}
              pending={pending}
              onRun={(text) => void sendAgent(text)}
              onProposal={handleProposal}
            />
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
                  A preparar…
                </p>
              ) : null}
              <div ref={endRef} />
            </div>
          )}
        </div>

        <form
          className="flex shrink-0 flex-col gap-1.5 border-t border-border bg-background px-3 py-2"
          onSubmit={(e) => {
            e.preventDefault()
            void sendAgent(draft)
          }}
        >
          {chat.length > 0 ? (
            <button
              type="button"
              disabled={busyAgent}
              onClick={() => void sendAgent(MARKETING_PLAYBOOKS[0].prompt)}
              className="self-start rounded border border-border px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              {MARKETING_PLAYBOOKS[0].label}
            </button>
          ) : null}
          <div className="flex items-center gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ex.: campanha para vender Samsung A16 esta semana"
              className="h-9 text-[13px]"
              disabled={busyAgent}
              autoComplete="off"
            />
            <Button type="submit" size="sm" className="h-9 px-3" disabled={busyAgent || !draft.trim()}>
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </form>
      </section>

      <aside className="hidden min-h-0 w-[19.5rem] shrink-0 flex-col overflow-hidden border-l border-border bg-background lg:flex">
        {rail}
      </aside>

      <Sheet open={railOpen} onOpenChange={setRailOpen}>
        <SheetContent side="right" className="w-[19.5rem] gap-0 p-0 sm:max-w-[19.5rem]">
          <SheetHeader className="sr-only">
            <SheetTitle>Painel da campanha</SheetTitle>
          </SheetHeader>
          {rail}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function DepartmentStart({
  pulse,
  live,
  pendingCampaign,
  busyAgent,
  applyingId,
  pending,
  onRun,
  onProposal,
}: {
  pulse: MarketingPulse
  live: MarketingPulse["liveCampaign"]
  pendingCampaign?: MarketingProposal | null
  busyAgent: boolean
  applyingId: string | null
  pending: boolean
  onRun: (prompt: string) => void
  onProposal: (id: string, action: "apply" | "reject") => void
}) {
  const revenueDelta = pulse.revenueThisWeek - pulse.revenueLastWeek
  const unitsDelta = pulse.ordersThisWeek - pulse.ordersLastWeek
  const topProducts = pulse.topProducts.slice(0, 4)

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="min-w-0 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground">Departamento</p>
            <h1 className="mt-0.5 text-base font-semibold leading-tight">Plano de venda</h1>
          </div>
          <Button asChild size="sm" variant="outline" className="h-8 shrink-0 gap-1.5 px-2.5 text-[12px]">
            <Link href="/dashboard/marketing/campaigns">
              <CalendarRange className="h-3.5 w-3.5" />
              Campanhas
            </Link>
          </Button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
          <MetricTile
            icon={TrendingUp}
            label="Receita 7d"
            value={formatCurrency(pulse.revenueThisWeek)}
            detail={`vs semana ant. ${formatSignedCurrency(revenueDelta)}`}
            detailClassName={trendClass(revenueDelta)}
          />
          <MetricTile
            icon={Store}
            label="Unidades 7d"
            value={String(pulse.ordersThisWeek)}
            detail={`vs semana ant. ${formatSignedNumber(unitsDelta)}`}
            detailClassName={trendClass(unitsDelta)}
          />
          <MetricTile
            icon={CalendarRange}
            label="Campanha live"
            value={live ? "Activa" : "Nenhuma"}
            detail={live?.name || "Criar campanha"}
          />
          <MetricTile
            icon={Target}
            label="Pixel"
            value={pulse.metaPixelId ? "Pronto" : "Pendente"}
            detail={pulse.metaPixelId ? "Conversões" : "Sem medição"}
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[12px] font-semibold">Acções rápidas</p>
            <span className="text-[11px] text-muted-foreground">{MARKETING_PLAYBOOKS.length} rotinas</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
          {MARKETING_PLAYBOOKS.map((book, index) => (
            <QuickPlaybookButton
              key={book.id}
              icon={PLAYBOOK_META[book.id]?.icon ?? Target}
              label={book.label}
              detail={PLAYBOOK_META[book.id]?.detail}
              primary={index === 0}
              disabled={busyAgent}
              onClick={() => onRun(book.prompt)}
            />
          ))}
          </div>
        </div>
      </section>

      <aside className="min-w-0 space-y-3 border-t border-border pt-3 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
        {pendingCampaign ? (
          <CampaignProposalPanel
            proposal={pendingCampaign}
            applying={applyingId === pendingCampaign.id}
            pending={pending}
            onApply={() => onProposal(pendingCampaign.id, "apply")}
          />
        ) : (
          <div className="rounded-md border border-border bg-background p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[12px] font-semibold">Na loja</p>
              {live ? (
                <Badge variant="outline" className={cn("shrink-0 text-[10px]", campaignStatusClass(live.status))}>
                  {campaignStatusLabel(live.status)}
                </Badge>
              ) : null}
            </div>
            <p className="mt-2 text-[13px] font-medium leading-snug">
              {live?.headline || live?.name || "Sem campanha activa"}
            </p>
            {live?.hook ? <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{live.hook}</p> : null}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {live ? (
                <>
                  <Button asChild size="sm" variant="outline" className="h-7 px-2 text-[11px]">
                    <Link href={`/dashboard/marketing/campaigns/${live.id}`}>Editar</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="h-7 gap-1 px-2 text-[11px]">
                    <a href={pulse.campaignUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-3 w-3" />
                      Loja
                    </a>
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  className="h-7 px-2 text-[11px]"
                  disabled={busyAgent}
                  onClick={() => onRun(MARKETING_PLAYBOOKS[0].prompt)}
                >
                  Criar campanha
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="rounded-md border border-border bg-background p-3">
          <p className="text-[12px] font-semibold">Mais vendidos 7d</p>
          {topProducts.length ? (
            <ul className="mt-2 space-y-1.5">
              {topProducts.map((product, index) => (
                <li key={product.productId} className="flex items-center justify-between gap-2 text-[12px]">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-muted text-[10px] tabular-nums text-muted-foreground">
                      {index + 1}
                    </span>
                    <span className="min-w-0 truncate">{product.productTitle}</span>
                  </span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">{product.totalSold} un.</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-[12px] text-muted-foreground">Sem vendas recentes.</p>
          )}
        </div>
      </aside>
    </div>
  )
}

const PLAYBOOK_META: Record<string, { icon: LucideIcon; detail: string }> = {
  "campaign-sell": { icon: Target, detail: "campanha + posts + imagem" },
  "social-post": { icon: Send, detail: "copy para Facebook e Instagram" },
  "salary-week": { icon: CalendarRange, detail: "fim do mês em Cabo Verde" },
  "slow-stock": { icon: TrendingUp, detail: "rodar produtos parados" },
  launch: { icon: Store, detail: "produto novo em destaque" },
}

function MetricTile({
  icon: Icon,
  label,
  value,
  detail,
  detailClassName,
}: {
  icon: LucideIcon
  label: string
  value: string
  detail?: string
  detailClassName?: string
}) {
  return (
    <div className="min-h-[5.25rem] rounded-md border border-border bg-background px-3 py-2">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[11px]">{label}</span>
      </div>
      <p className="mt-1 truncate text-[15px] font-semibold tabular-nums">{value}</p>
      {detail ? (
        <p className={cn("mt-0.5 truncate text-[11px] text-muted-foreground", detailClassName)}>
          {detail}
        </p>
      ) : null}
    </div>
  )
}

function QuickPlaybookButton({
  icon: Icon,
  label,
  detail,
  primary,
  disabled,
  onClick,
}: {
  icon: LucideIcon
  label: string
  detail?: string
  primary?: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex min-h-14 items-center gap-3 rounded-md border px-3 py-2 text-left disabled:opacity-50",
        primary
          ? "border-foreground bg-foreground text-background"
          : "border-border hover:bg-muted/60",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-medium">{label}</span>
        {detail ? (
          <span className={cn("mt-0.5 block truncate text-[11px]", primary ? "text-background/70" : "text-muted-foreground")}>
            {detail}
          </span>
        ) : null}
      </span>
    </button>
  )
}

function CampaignProposalPanel({
  proposal,
  applying,
  pending,
  onApply,
  onReview,
}: {
  proposal: MarketingProposal
  applying: boolean
  pending: boolean
  onApply: () => void
  onReview?: () => void
}) {
  const name = asString(proposal.payload.name) || proposal.title || "Campanha"
  const headline = asString(proposal.payload.headline)
  const hook = asString(proposal.payload.hook)
  const products = asStringList(proposal.payload.productIds)
  const channels = asStringList(proposal.payload.channels)

  return (
    <div className="rounded-md border border-border border-l-4 border-l-emerald-500 bg-background p-3">
      <div className="flex items-center justify-between gap-2">
        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700">
          Campanha pronta
        </Badge>
        <span className="truncate text-[11px] text-muted-foreground">{campaignProposalRange(proposal)}</span>
      </div>
      <p className="mt-2 text-[13px] font-semibold leading-snug">{headline || name}</p>
      {hook ? <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{hook}</p> : null}
      <div className="mt-2 flex flex-wrap gap-1 text-[11px] text-muted-foreground">
        <span>{products.length || 0} produtos</span>
        <span>·</span>
        <span>{channels.length ? channels.join(" + ") : "store + social"}</span>
      </div>
      <div className="mt-3 flex gap-1.5">
        <Button
          type="button"
          size="sm"
          className="h-8 flex-1 text-[12px]"
          disabled={applying || pending}
          onClick={onApply}
        >
          {applying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Meter na loja
        </Button>
        {onReview ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 px-2 text-[12px]"
            disabled={applying}
            onClick={onReview}
          >
            Rever
          </Button>
        ) : null}
      </div>
    </div>
  )
}

function formatSignedCurrency(value: number) {
  if (!value) return "sem variação"
  return `${value > 0 ? "+" : ""}${formatCurrency(value)}`
}

function formatSignedNumber(value: number) {
  if (!value) return "sem variação"
  return `${value > 0 ? "+" : ""}${value}`
}

function trendClass(value: number) {
  if (value > 0) return "text-emerald-600"
  if (value < 0) return "text-rose-600"
  return undefined
}

function DeskRail({
  tab,
  onTab,
  siteName,
  pendingProposals,
  campaignProposal,
  applyingId,
  pending,
  onProposal,
  facebookPost,
  instagramCaption,
  whatsappText,
  campaignUrl,
  waOfferHref,
  onCopy,
  hasDraftCopy,
  latestImage,
  format,
  onFormat,
  prompt,
  onPrompt,
  busyImage,
  onGenerate,
}: {
  tab: RailTab
  onTab: (tab: RailTab) => void
  siteName: string
  pendingProposals: MarketingProposal[]
  campaignProposal?: MarketingProposal | null
  applyingId: string | null
  pending: boolean
  onProposal: (id: string, action: "apply" | "reject") => void
  facebookPost: string
  instagramCaption: string
  whatsappText: string
  campaignUrl: string
  waOfferHref: string | null
  onCopy: (label: string, text: string) => void
  hasDraftCopy: boolean
  latestImage: { url: string; format: string; prompt: string } | null
  format: FormatKey
  onFormat: (format: FormatKey) => void
  prompt: string
  onPrompt: (value: string) => void
  busyImage: boolean
  onGenerate: () => void
}) {
  const [previewChannel, setPreviewChannel] = useState<"facebook" | "instagram">("facebook")
  const tabs: { id: RailTab; label: string; count?: number }[] = [
    { id: "publicar", label: "Publicar" },
    { id: "aprovar", label: "Aprovar", count: pendingProposals.length },
  ]

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex h-10 shrink-0 items-center gap-0.5 border-b border-border px-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onTab(item.id)}
            className={cn(
              "rounded-md px-2 py-1 text-[12px] font-medium",
              tab === item.id
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
            {item.count ? (
              <span className="ml-1 tabular-nums opacity-80">{item.count}</span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {tab === "publicar" ? (
          <div className="space-y-3">
            {campaignProposal ? (
              <CampaignProposalPanel
                proposal={campaignProposal}
                applying={applyingId === campaignProposal.id}
                pending={pending}
                onApply={() => onProposal(campaignProposal.id, "apply")}
                onReview={() => onTab("aprovar")}
              />
            ) : null}
            <MarketingPostPreview
              siteName={siteName}
              imageUrl={latestImage?.url}
              caption={previewChannel === "facebook" ? facebookPost : instagramCaption}
              channel={previewChannel}
              onChannel={setPreviewChannel}
            />
            <div className="flex flex-wrap gap-1">
              <CopyChip label="Facebook" onClick={() => onCopy("Facebook", facebookPost)} />
              <CopyChip label="Instagram" onClick={() => onCopy("Instagram", instagramCaption)} />
              <CopyChip label="WhatsApp" onClick={() => onCopy("WhatsApp", whatsappText)} />
              <CopyChip label="Link" onClick={() => onCopy("Link", campaignUrl)} />
              {waOfferHref ? (
                <a
                  href={waOfferHref}
                  target="_blank"
                  rel="noreferrer"
                  className="h-6 rounded border border-border px-2 text-[11px] leading-6 text-muted-foreground hover:text-foreground"
                >
                  Abrir WA
                </a>
              ) : null}
            </div>
            {!latestImage ? (
              <div className="rounded-md border border-dashed border-border px-3 py-3">
                <div className="flex gap-1">
                  {FORMATS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onFormat(item.id)}
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
                  onChange={(e) => onPrompt(e.target.value)}
                  placeholder="Prompt da imagem"
                  className="mt-2 min-h-16 field-sizing-fixed text-[12px]"
                />
                <Button
                  type="button"
                  size="sm"
                  className="mt-2 h-8 w-full"
                  disabled={busyImage || !prompt.trim()}
                  onClick={onGenerate}
                >
                  {busyImage ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
                  {busyImage ? "A gerar…" : "Gerar imagem"}
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 w-full text-[12px]"
                disabled={busyImage || !prompt.trim()}
                onClick={onGenerate}
              >
                {busyImage ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
                Nova imagem
              </Button>
            )}
            {hasDraftCopy ? (
              <p className="text-[11px] text-muted-foreground">Pack novo. Copia e cola nas redes.</p>
            ) : null}
          </div>
        ) : null}

        {tab === "aprovar" ? (
          pendingProposals.length === 0 ? (
            <p className="text-[12px] leading-relaxed text-muted-foreground">
              Nada à espera. Cria uma campanha no chat.
            </p>
          ) : (
            <ul className="space-y-2">
              {pendingProposals.map((p) => (
                <li key={p.id} className="rounded-md border border-border px-2.5 py-2">
                  <p className="text-[13px] font-medium leading-snug">{p.title}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{labelForType(p.type)}</p>
                  <div className="mt-2 flex gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      className="h-7 px-2 text-[11px]"
                      disabled={applyingId === p.id || pending}
                      onClick={() => onProposal(p.id, "apply")}
                    >
                      {applyingId === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                      {p.type === "campaign" ? "Meter na loja" : "Guardar"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-[11px]"
                      disabled={applyingId === p.id}
                      onClick={() => onProposal(p.id, "reject")}
                    >
                      <X className="h-3 w-3" />
                      Não
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )
        ) : null}
      </div>
    </div>
  )
}

function labelForType(type: string) {
  const map: Record<string, string> = {
    campaign: "Campanha",
    campaign_attach: "Ligar à campanha",
    weekly_offer: "Oferta",
    social_pack: "Publicação FB/IG",
    banner: "Banner",
    banner_update: "Actualizar banner",
    coupon: "Cupão",
    product_merch: "Produto",
    image_prompt: "Prompt de imagem",
  }
  return map[type] ?? type
}

function CopyChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-6 items-center gap-1 rounded border border-border px-2 text-[11px] text-muted-foreground hover:text-foreground"
    >
      <Copy className="h-3 w-3" />
      {label}
    </button>
  )
}
