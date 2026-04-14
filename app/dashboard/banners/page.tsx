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
  Trash2,
  Loader2,
  Edit,
  CheckCircle2,
  XCircle,
  CalendarDays,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
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

  const handleDeleteBanner = async (bannerId: string, bannerTitle: string) => {
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

  const handleEditBanner = (banner: Banner) => {
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
  const activeTotal = data?.banners?.filter((b) => b.status?.code === "ACTIVE").length ?? 0

  const formatDateRange = (start?: string | null, end?: string | null) => {
    if (!start && !end) return "Sem período"
    const formatter = new Intl.DateTimeFormat("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    const startLabel = start ? formatter.format(new Date(start)) : "—"
    const endLabel = end ? formatter.format(new Date(end)) : "—"
    return `${startLabel} - ${endLabel}`
  }

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
                  <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                    <span>{loading ? "A carregar…" : `${total} banner${total !== 1 ? "s" : ""}`}</span>
                    {!loading && (
                      <>
                        <span>•</span>
                        <span>{activeTotal} ativo{activeTotal !== 1 ? "s" : ""}</span>
                      </>
                    )}
                  </div>
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
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  {/* Desktop table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/40 border-b border-border">
                        <tr>
                          <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Banner</th>
                          <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                          <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Posição</th>
                          <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Período</th>
                          <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Ordem</th>
                          <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBanners.map((banner) => {
                          const isActive = banner.status?.code === "ACTIVE"
                          const isDeleting = deletingBannerId === banner.id
                          return (
                            <tr key={banner.id} className="border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3 min-w-[260px]">
                                  <div className="h-12 w-20 rounded-md overflow-hidden border border-border bg-muted shrink-0">
                                    {banner.image ? (
                                      <img src={banner.image} alt={banner.title} className="h-full w-full object-cover" />
                                    ) : (
                                      <div className="h-full w-full flex items-center justify-center">
                                        <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-foreground truncate">{banner.title}</p>
                                    {banner.subtitle && (
                                      <p className="text-xs text-muted-foreground truncate">{banner.subtitle}</p>
                                    )}
                                    {banner.link && (
                                      <a
                                        href={banner.link}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 mt-0.5 text-[11px] text-primary hover:underline"
                                      >
                                        Ver link
                                        <ExternalLink className="h-3 w-3" />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                {isActive ? (
                                  <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium badge-success">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Ativo
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium badge-neutral">
                                    <XCircle className="h-3 w-3" />
                                    Inativo
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-xs text-foreground">
                                {banner.position || "—"}
                              </td>
                              <td className="px-4 py-3 text-xs text-muted-foreground">
                                <span className="inline-flex items-center gap-1">
                                  <CalendarDays className="h-3.5 w-3.5" />
                                  {formatDateRange(banner.startDate, banner.endDate)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs font-medium text-foreground">
                                {banner.orderIndex ?? "—"}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs"
                                    onClick={() => handleEditBanner(banner)}
                                  >
                                    <Edit className="h-3.5 w-3.5 mr-1.5" />
                                    Editar
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs text-destructive hover:text-destructive"
                                    onClick={() => handleDeleteBanner(banner.id, banner.title)}
                                    disabled={isDeleting}
                                  >
                                    {isDeleting ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-3.5 w-3.5" />
                                    )}
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="md:hidden grid gap-3 p-3">
                  {filteredBanners.map((banner) => {
                    const isActive = banner.status?.code === "ACTIVE"
                    const isDeleting = deletingBannerId === banner.id

                    return (
                      <div key={banner.id} className="rounded-xl border border-border bg-card overflow-hidden">
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
                        </div>

                        <div className="p-3">
                          <h3 className="font-semibold text-sm text-foreground truncate mb-0.5">{banner.title}</h3>
                          {banner.subtitle && (
                            <p className="text-xs text-muted-foreground truncate">{banner.subtitle}</p>
                          )}
                          <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                            <p>Posição: <span className="text-foreground">{banner.position || "—"}</span></p>
                            <p>Período: <span className="text-foreground">{formatDateRange(banner.startDate, banner.endDate)}</span></p>
                            <p>Ordem: <span className="text-foreground">{banner.orderIndex ?? "—"}</span></p>
                          </div>
                          {banner.link && (
                            <a
                              href={banner.link}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 mt-2 text-[11px] text-primary hover:underline"
                            >
                              Ver link
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          <div className="mt-3 flex items-center gap-2">
                            <Button variant="outline" size="sm" className="h-8 text-xs flex-1" onClick={() => handleEditBanner(banner)}>
                              <Edit className="h-3.5 w-3.5 mr-1.5" />
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs text-destructive hover:text-destructive"
                              onClick={() => handleDeleteBanner(banner.id, banner.title)}
                              disabled={isDeleting}
                            >
                              {isDeleting ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  </div>
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
