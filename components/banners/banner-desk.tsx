"use client"

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
import type { MarketingPulse } from "@/lib/graphql/marketing/types"
import { useMarketingStudio } from "@/lib/marketing/use-marketing-studio"
import { cn } from "@/lib/utils"
import { useState } from "react"

function asString(value: unknown) {
  return typeof value === "string" ? value : ""
}

export function BannerDesk({ pulse }: { pulse: MarketingPulse }) {
  const studio = useMarketingStudio("banner", pulse.desk)
  const [createOpen, setCreateOpen] = useState(false)
  const [editBanner, setEditBanner] = useState<Banner | null>(null)
  const [applying, setApplying] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data, refetch } = useQuery<{ banners: Banner[] }>(GET_BANNERS)
  const [deleteBanner] = useMutation(DELETE_BANNER, {
    refetchQueries: [{ query: GET_BANNERS }],
  })

  const proposal = studio.pack.proposal
  const payload = proposal?.payload ?? {}
  const title = asString(payload.title)
  const subtitle = asString(payload.subtitle)
  const buttonText = asString(payload.buttonText) || "Ver ofertas"
  const link = asString(payload.link) || "/campanha"
  const position = asString(payload.position) || "hero"
  const isUpdate = proposal?.type === "banner_update"
  const banners = data?.banners ?? []
  const showPlaybooks = studio.chat.length === 0 && !studio.busyAgent && !studio.hydrating

  async function putOnSite() {
    if (!proposal || applying) return
    setApplying(true)
    try {
      const res = await fetch(`/api/marketing/proposals/${proposal.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "apply", imageUrl: studio.pack.imageUrl }),
      })
      const json = (await res.json()) as { error?: string; note?: string }
      if (!res.ok) throw new Error(json.error || "Falha")
      showToast.success(json.note || "No site")
      studio.markApplied()
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
          <header className="flex h-10 shrink-0 items-center justify-between border-b border-border px-3">
            <p className="text-[13px] font-medium">O que vai no hero?</p>
            {studio.chat.length > 0 ? (
              <button
                type="button"
                className="text-[11px] text-muted-foreground hover:text-foreground"
                onClick={() => studio.resetConversation()}
              >
                Nova conversa
              </button>
            ) : null}
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {showPlaybooks ? (
              <div className="mx-auto flex max-w-lg flex-col gap-1 px-4 py-6">
                <p className="text-[13px] font-medium">Agente de banners</p>
                <p className="mb-2 text-[12px] leading-relaxed text-muted-foreground">
                  O agente monta o hero da homepage: texto, imagem e link. Tu geras a imagem e metes no site.
                </p>
                {MARKETING_BANNER_PLAYBOOKS.map((book) => (
                  <button
                    key={book.id}
                    type="button"
                    disabled={studio.busyAgent}
                    onClick={() => void studio.sendAgent(book.prompt)}
                    className="rounded-md border border-border px-3 py-2 text-left text-[13px] hover:bg-muted/60 disabled:opacity-50"
                  >
                    {book.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="mx-auto flex max-w-2xl flex-col gap-2.5 px-4 py-4">
                {studio.chat.map((line, i) => (
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
                {studio.busyAgent ? (
                  <p className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    A montar o banner…
                  </p>
                ) : null}
                <div ref={studio.endRef} />
              </div>
            )}
          </div>
          <form
            className="flex shrink-0 items-center gap-2 border-t border-border bg-background px-3 py-2"
            onSubmit={(e) => {
              e.preventDefault()
              void studio.sendAgent(studio.draft)
            }}
          >
            <Input
              value={studio.draft}
              onChange={(e) => studio.setDraft(e.target.value)}
              placeholder="Ex.: hero do Samsung A16 esta semana"
              className="h-9 text-[13px]"
              disabled={studio.busyAgent}
              autoComplete="off"
            />
            <Button type="submit" size="sm" className="h-9 px-3" disabled={studio.busyAgent || !studio.draft.trim()}>
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
            {studio.busyAgent && !proposal ? (
              <p className="text-[12px] text-muted-foreground">A montar o hero…</p>
            ) : proposal ? (
              <div className="space-y-3">
                <MarketingBannerPreview
                  title={title}
                  subtitle={subtitle}
                  buttonText={buttonText}
                  imageUrl={studio.pack.imageUrl}
                  position={position}
                />
                <p className="text-[12px] text-muted-foreground">
                  Link: <span className="font-mono text-foreground">{link}</span>
                </p>
                {!studio.pack.imageUrl ? (
                  <Button
                    type="button"
                    size="sm"
                    className="h-7 w-full text-[11px]"
                    disabled={studio.busyImage || !studio.pack.imagePrompt.trim()}
                    onClick={() => void studio.generateImage()}
                  >
                    {studio.busyImage ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImageIcon className="h-3 w-3" />}
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
          {proposal ? (
            <div className="flex shrink-0 items-center gap-2 border-t border-border px-3 py-2">
              <Button type="button" size="sm" className="h-8 flex-1" disabled={applying} onClick={() => void putOnSite()}>
                {applying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {isUpdate ? "Actualizar no site" : "Meter no site"}
              </Button>
              {studio.pack.imageUrl ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8"
                  disabled={studio.busyImage || !studio.pack.imagePrompt.trim()}
                  onClick={() => void studio.generateImage()}
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
