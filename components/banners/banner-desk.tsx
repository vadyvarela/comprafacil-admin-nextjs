"use client"

import { useMutation, useQuery } from "@apollo/client/react"
import { ImageIcon, Loader2, Plus, Trash2 } from "lucide-react"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { DataPanel, DataPanelContent } from "@/components/admin/data-panel"
import { EmptyState } from "@/components/admin/empty-state"
import { PageToolbar } from "@/components/admin/page-toolbar"
import { Button } from "@/components/ui/button"
import { useConfirmDialog } from "@/components/ui/confirm-dialog"
import { showToast } from "@/lib/utils/toast"
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

  const { data, loading } = useQuery<{ banners: Banner[] }>(GET_BANNERS)
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
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <PageToolbar
          icon={ImageIcon}
          iconBg="bg-rose-50"
          iconColor="text-rose-700"
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

        <div className="min-h-0 flex-1 overflow-y-auto bg-background p-4 md:p-5">
          {loading ? (
            <DataPanel className="mx-auto max-w-4xl">
              <DataPanelContent className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                A carregar banners…
              </DataPanelContent>
            </DataPanel>
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
              <DataPanelContent className="p-2">
                <ul className="grid gap-2">
                  {banners.map((banner) => {
                    const active = banner.status?.code === "ACTIVE"
                    return (
                      <li
                        key={banner.id}
                        className="flex items-center gap-3 rounded-md border border-border/70 bg-background px-3 py-2.5 transition-colors hover:bg-muted/30"
                      >
                        {banner.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={banner.image} alt="" className="h-12 w-20 shrink-0 rounded-md object-cover" />
                        ) : (
                          <span className="flex h-12 w-20 shrink-0 items-center justify-center rounded-md bg-muted">
                            <ImageIcon className="h-4 w-4 text-muted-foreground/50" />
                          </span>
                        )}
                        <button
                          type="button"
                          className="min-w-0 flex-1 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                          onClick={() => setEditBanner(banner)}
                        >
                          <p className="truncate text-sm font-medium">{banner.title}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {active ? "Activo" : "Inactivo"}
                            {banner.position ? ` · ${banner.position}` : ""}
                            {banner.link ? ` · ${banner.link}` : ""}
                          </p>
                        </button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                          disabled={deletingId === banner.id}
                          onClick={() => void handleDelete(banner)}
                          aria-label="Eliminar banner"
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
