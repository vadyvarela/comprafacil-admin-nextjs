"use client"

import { useState } from "react"
import { useQuery, useMutation } from "@apollo/client/react"
import { GET_BANNERS } from "@/lib/graphql/banners/queries"
import { DELETE_BANNER } from "@/lib/graphql/banners/mutations"
import { Banner } from "@/lib/graphql/banners/types"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { CreateBannerModal } from "@/components/banners/create-banner-modal"
import { EditBannerModal } from "@/components/banners/edit-banner-modal"
import {
  Image as ImageIcon,
  Plus,
  Search,
  MoreVertical,
  Trash2,
  Loader2,
  Edit,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { showToast } from "@/lib/utils/toast"

export default function BannersPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [deletingBannerId, setDeletingBannerId] = useState<string | null>(null)

  const { data, loading, error, refetch } = useQuery<{ banners: Banner[] }>(GET_BANNERS)

  const [deleteBanner] = useMutation(DELETE_BANNER, {
    refetchQueries: [{ query: GET_BANNERS }],
  })

  const handleDeleteBanner = async (bannerId: string, bannerTitle: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm(`Excluir o banner "${bannerTitle}"? Esta ação não pode ser desfeita.`)) return
    setDeletingBannerId(bannerId)
    try {
      await deleteBanner({ variables: { id: bannerId } })
      showToast.success("Banner excluído", `"${bannerTitle}" foi excluído`)
    } catch (err: any) {
      showToast.error("Erro", err?.message || "Erro ao excluir banner")
    } finally {
      setDeletingBannerId(null)
    }
  }

  const handleEditBanner = (banner: Banner, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedBanner(banner)
    setEditModalOpen(true)
  }

  const filteredBanners =
    data?.banners.filter((b) => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        b.title.toLowerCase().includes(q) ||
        b.subtitle?.toLowerCase().includes(q) ||
        b.position?.toLowerCase().includes(q)
      )
    }) || []

  const total = data?.banners?.length ?? 0

  return (
    <>
      <DashboardHeader items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Banners" }]} />
      <div className="flex flex-1 flex-col min-h-0">
        {/* Toolbar */}
        <div className="border-b border-border bg-card/60 backdrop-blur">
          <div className="px-5 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-pink-500/10">
                  <ImageIcon className="h-4.5 w-4.5 text-pink-600" />
                </div>
                <div>
                  <h1 className="text-base font-bold tracking-tight text-foreground">Banners</h1>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {loading ? "A carregar…" : `${total} banner${total !== 1 ? "s" : ""}`}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="relative w-56 sm:w-64">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Título, posição…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-xs"
                  />
                </div>
                <Button onClick={() => setCreateModalOpen(true)} size="sm" className="h-8 text-xs gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Novo banner
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-5">
          {loading && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))}
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl border border-destructive/40 bg-destructive/5 text-xs">
              <p className="font-semibold text-destructive mb-1">Erro ao carregar</p>
              <p className="text-muted-foreground mb-3">{error.message}</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Tentar novamente
              </Button>
            </div>
          )}

          {!loading && !error && (
            <>
              {filteredBanners.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center max-w-sm mx-auto">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-4">
                    <ImageIcon className="h-7 w-7 text-muted-foreground/50" />
                  </div>
                  <h2 className="text-sm font-semibold mb-1">
                    {searchQuery ? "Nenhum resultado" : "Sem banners"}
                  </h2>
                  <p className="text-xs text-muted-foreground mb-4">
                    {searchQuery ? "Tente outro termo." : "Crie o primeiro banner promocional."}
                  </p>
                  {!searchQuery && (
                    <Button onClick={() => setCreateModalOpen(true)} size="sm" className="gap-1.5">
                      <Plus className="h-3.5 w-3.5" />
                      Criar banner
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredBanners.map((banner) => {
                    const isActive = banner.status?.code === "ACTIVE"
                    const isDeleting = deletingBannerId === banner.id

                    return (
                      <div key={banner.id} className="group rounded-xl border border-border bg-card overflow-hidden hover:border-primary/30 hover:shadow-sm transition-all">
                        {/* Image */}
                        <div className="relative h-36 bg-muted">
                          {banner.image ? (
                            <img
                              src={banner.image}
                              alt={banner.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                            </div>
                          )}
                          {/* Overlay badges */}
                          <div className="absolute top-2 left-2 flex gap-1.5">
                            {isActive ? (
                              <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium badge-success backdrop-blur-sm bg-white/80">
                                <CheckCircle2 className="h-3 w-3" />
                                Ativo
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium badge-neutral backdrop-blur-sm bg-white/80">
                                <XCircle className="h-3 w-3" />
                                Inativo
                              </span>
                            )}
                            {banner.position && (
                              <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium badge-info backdrop-blur-sm bg-white/80">
                                {banner.position}
                              </span>
                            )}
                          </div>
                          {/* Actions */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="secondary"
                                  size="icon"
                                  className="h-7 w-7 backdrop-blur-sm"
                                  disabled={isDeleting}
                                >
                                  {isDeleting ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <MoreVertical className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-36">
                                <DropdownMenuItem onClick={(e) => handleEditBanner(banner, e)}>
                                  <Edit className="h-3.5 w-3.5 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={(e) => handleDeleteBanner(banner.id, banner.title, e)}
                                  disabled={isDeleting}
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {/* Info */}
                        <div className="p-3">
                          <h3 className="font-semibold text-sm text-foreground truncate">{banner.title}</h3>
                          {banner.subtitle && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{banner.subtitle}</p>
                          )}
                          {banner.orderIndex != null && (
                            <p className="text-[11px] text-muted-foreground/60 mt-1">Ordem: {banner.orderIndex}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <CreateBannerModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
      {selectedBanner && (
        <EditBannerModal
          open={editModalOpen}
          onOpenChange={(open) => {
            setEditModalOpen(open)
            if (!open) setSelectedBanner(null)
          }}
          banner={selectedBanner}
        />
      )}
    </>
  )
}
