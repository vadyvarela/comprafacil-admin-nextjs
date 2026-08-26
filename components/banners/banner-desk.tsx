"use client"

import { useMutation, useQuery } from "@apollo/client/react"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
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

  const { data, loading } = useQuery<{ banners: Banner[] }>(GET_BANNERS)
  const [deleteBanner] = useMutation(DELETE_BANNER, {
    refetchQueries: [{ query: GET_BANNERS }],
  })

  const banners = data?.banners ?? []

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
          className="ml-auto h-7 gap-1.5 text-[11px]"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          Novo banner
        </Button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {loading ? (
          <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            A carregar…
          </p>
        ) : banners.length === 0 ? (
          <div className="mx-auto max-w-md rounded-md border border-dashed border-border px-6 py-10 text-center">
            <p className="text-[13px] font-medium">Ainda sem banners</p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Cria o primeiro banner para a homepage ou secções promocionais.
            </p>
            <Button type="button" size="sm" className="mt-4 h-8" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Novo banner
            </Button>
          </div>
        ) : (
          <ul className="mx-auto grid max-w-4xl gap-2">
            {banners.map((banner) => {
              const active = banner.status?.code === "ACTIVE"
              return (
                <li
                  key={banner.id}
                  className="flex items-center gap-3 rounded-md border border-border px-3 py-2.5"
                >
                  {banner.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={banner.image} alt="" className="h-12 w-20 shrink-0 rounded object-cover" />
                  ) : (
                    <span className="h-12 w-20 shrink-0 rounded bg-muted" />
                  )}
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => setEditBanner(banner)}
                  >
                    <p className="truncate text-[13px] font-medium">{banner.title}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {active ? "Live" : "Inactivo"}
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
                    aria-label="Excluir"
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
    </div>
  )
}
