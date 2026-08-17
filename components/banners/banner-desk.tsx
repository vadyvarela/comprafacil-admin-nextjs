"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useMutation, useQuery } from "@apollo/client/react"
import { ImageIcon, Loader2, Plus, Send, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { showToast } from "@/lib/utils/toast"
import { MARKETING_BANNER_PLAYBOOKS } from "@/lib/marketing/playbooks"
import { AgentMessage } from "@/components/marketing/agent-message"
import { MarketingBannerPreview } from "@/components/marketing/marketing-banner-preview"
import { CreateBannerModal } from "@/components/banners/create-banner-modal"
import { EditBannerModal } from "@/components/banners/edit-banner-modal"
import { GET_BANNERS } from "@/lib/graphql/banners/queries"
import { DELETE_BANNER } from "@/lib/graphql/banners/mutations"
import type { Banner } from "@/lib/graphql/banners/types"
import type { MarketingDesk, MarketingImageRecord, MarketingProposal, MarketingPulse } from "@/lib/graphql/marketing/types"
import { cn } from "@/lib/utils"

type ChatLine = { role: "user" | "assistant"; content: string }

function asString(value: unknown) {
  return typeof value === "string" ? value : ""
}

export function BannerDesk({ pulse }: { pulse: MarketingPulse }) {
  const [threadId, setThreadId] = useState<string | null>(null)
  const [chat, setChat] = useState<ChatLine[]>([])
  const [draft, setDraft] = useState("")
  const [proposals, setProposals] = useState(pulse.proposals)
  const [desk, setDesk] = useState<MarketingDesk>(pulse.desk)
  const [busyAgent, setBusyAgent] = useState(false)
  const [busyImage, setBusyImage] = useState(false)
  const [applying, setApplying] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [editBanner, setEditBanner] = useState<Banner | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  const { data, refetch } = useQuery<{ banners: Banner[] }>(GET_BANNERS)
  const [deleteBanner] = useMutation(DELETE_BANNER, {
    refetchQueries: [{ query: GET_BANNERS }],
  })

  const bannerProposal = useMemo(
    () =>
      proposals.find(
        (p) => p.status === "pending" && (p.type === "banner" || p.type === "banner_update"),
      ) ?? null,
    [proposals],
  )
  const imageProposal = useMemo(
    () => proposals.find((p) => p.status === "pending" && p.type === "image_prompt") ?? null,
    [proposals],
  )

  const payload = bannerProposal?.payload ?? {}
  const title = asString(payload.title)
  const subtitle = asString(payload.subtitle)
  const buttonText = asString(payload.buttonText) || "Ver ofertas"
  const link = asString(payload.link) || "/campanha"
  const position = asString(payload.position) || "hero"
  const imagePrompt =
    asString(payload.imagePrompt) || asString(imageProposal?.payload.prompt)
  const latestImage =
    desk.latestImages.find((img) => img.format === "banner") ?? desk.latestImages[0] ?? null
  const isUpdate = bannerProposal?.type === "banner_update"
  const banners = data?.banners ?? []

  useEffect(() => {
    setDesk(pulse.desk)
    setProposals(pulse.proposals)
  }, [pulse])

  useEffect(() => {
    queueMicrotask(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }))
  }, [chat, busyAgent])

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
        body: JSON.stringify({ message, threadId, intent: "banner" }),
      })
      const json = (await res.json()) as {
        error?: string
        reply?: string
        threadId?: string
        proposals?: MarketingProposal[]
        desk?: MarketingDesk
      }
      if (!res.ok) throw new Error(json.error || "Falha no agente")
      if (json.threadId) setThreadId(json.threadId)
      setChat((prev) => [...prev, { role: "assistant", content: json.reply || "" }])
      if (json.proposals) setProposals(json.proposals)
      if (json.desk) setDesk(json.desk)
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
        body: JSON.stringify({ prompt: imagePrompt, format: "banner" }),
      })
      const json = (await res.json()) as { error?: string; url?: string; format?: string; prompt?: string }
      if (!res.ok) throw new Error(json.error || "Falha a gerar")
      if (json.url) {
        const next: MarketingImageRecord = {
          url: json.url,
          format: json.format || "banner",
          prompt: json.prompt || imagePrompt,
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

  async function putOnSite() {
    if (!bannerProposal || applying) return
    setApplying(true)
    try {
      const res = await fetch(`/api/marketing/proposals/${bannerProposal.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "apply", imageUrl: latestImage?.url }),
      })
      const json = (await res.json()) as { error?: string; note?: string }
      if (!res.ok) throw new Error(json.error || "Falha")
      showToast.success(json.note || "No site")
      setProposals((prev) => prev.filter((p) => p.id !== bannerProposal.id))
      await refetch()
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : "Falha")
    } finally {
      setApplying(false)
    }
  }

  async function handleDelete(banner: Banner) {
    if (!confirm(`Excluir «${banner.title}»?`)) return
    setDeletingId(banner.id)
    try {
      await deleteBanner({ variables: { id: banner.id } })
      showToast.success("Banner excluído")
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : "Falha a excluir")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="flex h-11 shrink-0 items-center gap-2 border-b border-border bg-background px-2 md:px-3">
        <SidebarTrigger className="-ml-0.5 size-8 shrink-0" />
        <Separator orientation="vertical" className="h-4" />
        <p className="text-[13px] font-medium">Banners</p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="ml-auto h-7 text-[11px] gap-1.5"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          Manual
        </Button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        <section className="flex min-h-0 min-w-0 flex-1 flex-col max-lg:max-h-[48%] lg:max-h-none">
          <header className="flex h-10 shrink-0 items-center border-b border-border px-3">
            <p className="text-[13px] font-medium">O que vai no hero?</p>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {chat.length === 0 && !busyAgent ? (
              <div className="mx-auto flex max-w-lg flex-col gap-1 px-4 py-6">
                <p className="text-[13px] font-medium">Agente de banners</p>
                <p className="mb-2 text-[12px] leading-relaxed text-muted-foreground">
                  O agente monta o hero da homepage: texto, imagem e link. Tu geras a imagem e metes no site.
                </p>
                {MARKETING_BANNER_PLAYBOOKS.map((book) => (
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
                    A montar o banner…
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
              placeholder="Ex.: hero do Samsung A16 esta semana"
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
            <p className="text-[13px] font-medium">Preview</p>
            <span className="text-[11px] capitalize text-muted-foreground">
              {position === "hero-side" ? "Lateral" : position === "promo" ? "Promo" : "Hero"}
            </span>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {busyAgent && !bannerProposal ? (
              <p className="text-[12px] text-muted-foreground">A montar o hero…</p>
            ) : bannerProposal ? (
              <div className="space-y-3">
                <MarketingBannerPreview
                  title={title}
                  subtitle={subtitle}
                  buttonText={buttonText}
                  imageUrl={latestImage?.url || asString(payload.imageUrl) || null}
                  position={position}
                />
                <p className="text-[12px] text-muted-foreground">
                  Link: <span className="font-mono text-foreground">{link}</span>
                </p>
                {!latestImage && !asString(payload.imageUrl) ? (
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
              </div>
            ) : (
              <p className="text-[12px] leading-relaxed text-muted-foreground">
                O preview do hero aparece aqui. Pede ao agente ou escolhe um atalho.
              </p>
            )}

            <p className="mb-2 mt-5 text-[12px] font-semibold">No site</p>
            {banners.length === 0 ? (
              <p className="text-[12px] text-muted-foreground">Ainda sem banners.</p>
            ) : (
              <ul className="space-y-1.5">
                {banners.map((banner) => {
                  const active = banner.status?.code === "ACTIVE"
                  return (
                    <li key={banner.id} className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5">
                      {banner.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={banner.image} alt="" className="h-8 w-12 shrink-0 rounded object-cover" />
                      ) : (
                        <span className="h-8 w-12 shrink-0 rounded bg-muted" />
                      )}
                      <button
                        type="button"
                        className="min-w-0 flex-1 text-left"
                        onClick={() => setEditBanner(banner)}
                      >
                        <p className="truncate text-[12px] font-medium">{banner.title}</p>
                        <p className="truncate text-[10px] text-muted-foreground">
                          {active ? "Live" : "Inactivo"}
                          {banner.position ? ` · ${banner.position}` : ""}
                        </p>
                      </button>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground"
                        disabled={deletingId === banner.id}
                        onClick={() => void handleDelete(banner)}
                        aria-label="Excluir"
                      >
                        {deletingId === banner.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
          {bannerProposal ? (
            <div className="flex shrink-0 items-center gap-2 border-t border-border px-3 py-2">
              <Button type="button" size="sm" className="h-8 flex-1" disabled={applying} onClick={() => void putOnSite()}>
                {applying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {isUpdate ? "Actualizar no site" : "Meter no site"}
              </Button>
              {latestImage || asString(payload.imageUrl) ? (
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

      <CreateBannerModal open={createOpen} onOpenChange={setCreateOpen} />
      {editBanner ? (
        <EditBannerModal
          open
          onOpenChange={(open) => {
            if (!open) setEditBanner(null)
          }}
          banner={editBanner}
        />
      ) : null}
    </div>
  )
}
