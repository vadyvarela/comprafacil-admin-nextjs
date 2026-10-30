"use client"

import { useMutation, useQuery } from "@apollo/client/react"
import { AlertTriangle, ImageIcon, Loader2, Plus, Trash2 } from "lucide-react"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { DataPanel, DataPanelContent } from "@/components/admin/data-panel"
import { EmptyState } from "@/components/admin/empty-state"
import { PageToolbar } from "@/components/admin/page-toolbar"
import { Button } from "@/components/ui/button"
import { useConfirmDialog } from "@/components/ui/confirm-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { showToast } from "@/lib/utils/toast"
import { cn } from "@/lib/utils"
import { isLocalLink, POSITION_LABEL } from "@/components/banners/banner-meta"
import { CreateBannerModal } from "@/components/banners/create-banner-modal"
import { EditBannerModal } from "@/components/banners/edit-banner-modal"
import { GET_BANNERS } from "@/lib/graphql/banners/queries"
import { DELETE_BANNER } from "@/lib/graphql/banners/mutations"
import type { Banner } from "@/lib/graphql/banners/types"
import { useState } from "react"

export function BannerDesk() {
  const [createOpen, setCreateOpen] = useState(false)
  const [editBanner, setEditBanner] = useState<Banner | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { confirm, confirmDialog } = useConfirmDialog()

  const { data, loading, error, refetch } = useQuery<{ banners: Banner[] }>(GET_BANNERS)
  const [deleteBanner] = useMutation(DELETE_BANNER, {
    refetchQueries: [{ query: GET_BANNERS }],
  })

  const banners = data?.banners ?? []

  async function handleDelete(banner: Banner) {
    const confirmed = await confirm({
      title: "Eliminar banner?",
      description: `Está prestes a eliminar "${banner.title}".`,
      impact: "O banner deixa de aparecer nas áreas promocionais onde estiver configurado. Esta ação não pode ser desfeita.",
      confirmText: "Eliminar banner",
      variant: "destructive",
    })

    if (!confirmed) return

    setDeletingId(banner.id)
    try {
      await deleteBanner({ variables: { id: banner.id } })
      showToast.success("Banner eliminado")
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : "Falha ao eliminar")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <DashboardHeader items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Banners" }]} />
      <div className="flex min-h-0 flex-1 flex-col">
        <PageToolbar
          icon={ImageIcon}
          iconBg="bg-danger-soft"
          iconColor="text-danger-strong"
          title="Banners"
          subtitle={loading ? "A carregar…" : `${banners.length} banner${banners.length !== 1 ? "s" : ""}`}
        >
          <Button
            type="button"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Novo banner
          </Button>
        </PageToolbar>

        <div className="flex-1 overflow-auto bg-background p-4 md:p-5">
          {loading ? (
            <DataPanel className="mx-auto max-w-4xl">
              <DataPanelContent className="divide-y divide-border/70" aria-busy="true" aria-label="A carregar banners">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                    <Skeleton className="h-14 w-24 shrink-0 rounded-md" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-48 max-w-full" />
                      <Skeleton className="h-3 w-32 max-w-full" />
                    </div>
                  </div>
                ))}
              </DataPanelContent>
            </DataPanel>
          ) : error ? (
            <div className="mx-auto max-w-4xl rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-xs">
              <p className="mb-1 font-semibold text-destructive">Erro ao carregar</p>
              <p className="mb-3 text-muted-foreground">{error.message}</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Tentar novamente
              </Button>
            </div>
          ) : banners.length === 0 ? (
            <DataPanel className="mx-auto max-w-4xl border-dashed">
              <EmptyState
                icon={ImageIcon}
                tone="info"
                title="Ainda sem banners"
                description="Cria o primeiro banner para a homepage ou secções promocionais."
                action={
                  <Button type="button" size="sm" className="h-8 gap-1.5" onClick={() => setCreateOpen(true)}>
                    <Plus className="h-3.5 w-3.5" />
                    Novo banner
                  </Button>
                }
              />
            </DataPanel>
          ) : (
            <DataPanel className="mx-auto max-w-4xl">
              <DataPanelContent>
                <ul className="divide-y divide-border/70">
                  {banners.map((banner) => {
                    const active = banner.status?.code === "ACTIVE"
                    const position = banner.position
                      ? POSITION_LABEL[banner.position] || banner.position
                      : null
                    const localLink = !!banner.link && isLocalLink(banner.link)
                    return (
                      <li
                        key={banner.id}
                        className="flex items-center gap-1 pr-2 transition-colors hover:bg-muted/30"
                      >
                        <button
                          type="button"
                          className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40"
                          onClick={() => setEditBanner(banner)}
                        >
                          <span className="flex h-14 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border/70 bg-muted/40">
                            {banner.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={banner.image} alt="" className="h-full w-full object-contain" />
                            ) : (
                              <ImageIcon className="h-4 w-4 text-muted-foreground/50" />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex min-w-0 items-center gap-2">
                              <span className="truncate text-sm font-medium">{banner.title}</span>
                              <span
                                className={cn(
                                  "shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                                  active
                                    ? "border-success-border bg-success-soft text-success-strong"
                                    : "border-border bg-muted text-muted-foreground"
                                )}
                              >
                                {active ? "Activo" : "Inactivo"}
                              </span>
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                              {position}
                              {position && banner.link ? " · " : ""}
                              {banner.link}
                            </span>
                            {localLink ? (
                              <span className="mt-1 flex items-center gap-1 text-[11px] font-medium text-warning-strong">
                                <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                Link local: não abre para os clientes. Usa um caminho como /entregas.
                              </span>
                            ) : null}
                          </span>
                        </button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                          disabled={deletingId === banner.id}
                          onClick={() => void handleDelete(banner)}
                          aria-label={`Eliminar banner ${banner.title}`}
                        >
                          {deletingId === banner.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </li>
                    )
                  })}
                </ul>
              </DataPanelContent>
            </DataPanel>
          )}
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
      {confirmDialog}
      </div>
    </>
  )
}
