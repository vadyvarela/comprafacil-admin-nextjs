"use client"

import { useState } from "react"
import { useQuery, useMutation } from "@apollo/client/react"
import { GET_BANNERS } from "@/lib/graphql/banners/queries"
import { DELETE_BANNER } from "@/lib/graphql/banners/mutations"
import { Banner } from "@/lib/graphql/banners/types"
import { AppSidebar } from "@/components/app-sidebar"
import { CreateBannerModal } from "@/components/banners/create-banner-modal"
import { EditBannerModal } from "@/components/banners/edit-banner-modal"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import Link from "next/link"
import {
  Image as ImageIcon,
  Plus,
  Search,
  ArrowRight,
  MoreVertical,
  Trash2,
  Loader2,
  Edit,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { showToast } from "@/lib/utils/toast"

export default function BannersPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [deletingBannerId, setDeletingBannerId] = useState<string | null>(null)

  const { data, loading, error, refetch } = useQuery<{
    banners: Banner[]
  }>(GET_BANNERS)

  const [deleteBanner] = useMutation(DELETE_BANNER, {
    refetchQueries: [{ query: GET_BANNERS }],
  })

  const handleDeleteBanner = async (bannerId: string, bannerTitle: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!confirm(`Tem certeza que deseja excluir o banner "${bannerTitle}"?\n\nEsta ação não pode ser desfeita.`)) {
      return
    }

    setDeletingBannerId(bannerId)
    try {
      await deleteBanner({ variables: { id: bannerId } })
      showToast.success("Banner excluído", `O banner "${bannerTitle}" foi excluído com sucesso`)
    } catch (err: any) {
      console.error("Error deleting banner:", err)
      const errorMessage = err?.message || "Erro ao excluir banner. Tente novamente."
      showToast.error("Erro ao excluir banner", errorMessage)
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
    data?.banners.filter((banner) => {
      if (!searchQuery.trim()) return true
      const query = searchQuery.toLowerCase()
      return (
        banner.title.toLowerCase().includes(query) ||
        banner.subtitle?.toLowerCase().includes(query) ||
        banner.description?.toLowerCase().includes(query) ||
        banner.position?.toLowerCase().includes(query)
      )
    }) || []

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Banners</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col">
          {/* Header */}
          <div className="border-b px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h1 className="text-xl font-semibold">Banners</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {data?.banners.length || 0} banner
                  {(data?.banners.length || 0) !== 1 ? "s" : ""}
                </p>
              </div>
              <Button
                onClick={() => setCreateModalOpen(true)}
                size="sm"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Novo
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 h-8 text-sm"
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-4">
            {loading && (
              <div className="space-y-2">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded" />
                ))}
              </div>
            )}

            {error && (
              <div className="p-3 rounded border border-destructive/50 bg-destructive/10 text-sm">
                <p className="font-medium text-destructive mb-1">Erro ao carregar</p>
                <p className="text-muted-foreground text-xs">{error.message}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  className="mt-2"
                >
                  Tentar Novamente
                </Button>
              </div>
            )}

            {!loading && !error && (
              <>
                {filteredBanners.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground mb-3" />
                    <h3 className="text-sm font-medium mb-1">
                      {searchQuery ? "Nenhum resultado" : "Nenhum banner"}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      {searchQuery
                        ? "Tente ajustar sua busca"
                        : "Comece criando seu primeiro banner"}
                    </p>
                    {!searchQuery && (
                      <Button
                        onClick={() => setCreateModalOpen(true)}
                        size="sm"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Criar Banner
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredBanners.map((banner) => (
                      <div
                        key={banner.id}
                        className="group relative"
                      >
                        <div className="flex items-center gap-3 p-3 rounded border hover:bg-accent/50 hover:border-border transition-colors">
                          <div className="h-16 w-24 rounded bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {banner.image ? (
                              <img
                                src={banner.image}
                                alt={banner.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h3 className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                                {banner.title}
                              </h3>
                              {banner.position && (
                                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                                  {banner.position}
                                </Badge>
                              )}
                              {banner.status.code === "ACTIVE" ? (
                                <Badge variant="default" className="text-xs px-1.5 py-0 bg-green-600">
                                  Ativo
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                                  Inativo
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              {banner.subtitle && (
                                <span className="truncate">{banner.subtitle}</span>
                              )}
                              {banner.orderIndex !== null && banner.orderIndex !== undefined && (
                                <span className="text-muted-foreground/60">
                                  Ordem: {banner.orderIndex}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => e.preventDefault()}
                                  disabled={deletingBannerId === banner.id}
                                >
                                  {deletingBannerId === banner.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <MoreVertical className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) => handleEditBanner(banner, e)}
                                >
                                  <Edit className="h-3.5 w-3.5 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={(e) => handleDeleteBanner(banner.id, banner.title, e)}
                                  disabled={deletingBannerId === banner.id}
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <CreateBannerModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
        />

        {selectedBanner && (
          <EditBannerModal
            open={editModalOpen}
            onOpenChange={(open) => {
              setEditModalOpen(open)
              if (!open) {
                setSelectedBanner(null)
              }
            }}
            banner={selectedBanner}
          />
        )}
      </SidebarInset>
    </SidebarProvider>
  )
}

