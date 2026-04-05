"use client"

import { useState } from "react"
import { useQuery, useMutation } from "@apollo/client/react"
import { GET_BRANDS } from "@/lib/graphql/brands/queries"
import { DELETE_BRAND } from "@/lib/graphql/brands/mutations"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { CreateBrandModal } from "@/components/brands/create-brand-modal"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tag, Plus, Pencil, Trash2, MoreVertical, Globe, Loader2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Brand } from "@/lib/graphql/brands/types"
import { showToast } from "@/lib/utils/toast"

function brandStatusClass(code: string | undefined): string {
  const c = code?.toUpperCase()
  if (c === "ACTIVE") return "badge-success"
  if (c === "INACTIVE" || c === "DISABLED") return "badge-neutral"
  return "badge-info"
}

export default function BrandsPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)
  const [deletingBrandId, setDeletingBrandId] = useState<string | null>(null)

  const { data, loading, error, refetch } = useQuery<{ brands: { data: Brand[] } }>(GET_BRANDS, {
    variables: { page: { page: 0, size: 100 } },
  })

  const [deleteBrand] = useMutation(DELETE_BRAND, {
    refetchQueries: [{ query: GET_BRANDS, variables: { page: { page: 0, size: 100 } } }],
  })

  const handleDelete = async (brand: Brand, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm(`Excluir a marca "${brand.name}"? Esta ação não pode ser desfeita.`)) return
    setDeletingBrandId(brand.id)
    try {
      await deleteBrand({ variables: { id: brand.id } })
      showToast.success("Marca excluída", `"${brand.name}" foi excluída`)
    } catch (err: any) {
      showToast.error("Erro", err?.message || "Erro ao excluir marca")
    } finally {
      setDeletingBrandId(null)
    }
  }

  const brands = data?.brands?.data || []

  return (
    <>
      <DashboardHeader items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Marcas" }]} />
      <div className="flex flex-1 flex-col min-h-0">
        {/* Toolbar */}
        <div className="border-b border-border bg-card/60 backdrop-blur">
          <div className="px-5 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
                  <Tag className="h-4.5 w-4.5 text-amber-600" />
                </div>
                <div>
                  <h1 className="text-base font-bold tracking-tight text-foreground">Marcas</h1>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {loading ? "A carregar…" : `${brands.length} marca${brands.length !== 1 ? "s" : ""}`}
                  </p>
                </div>
              </div>
              <Button onClick={() => setCreateModalOpen(true)} size="sm" className="h-8 text-xs gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Nova marca
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-5">
          {loading && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl border border-destructive/40 bg-destructive/5 text-xs">
              <p className="font-semibold text-destructive mb-1">Erro ao carregar</p>
              <p className="text-muted-foreground mb-3">{error.message}</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>Tentar novamente</Button>
            </div>
          )}

          {!loading && !error && (
            brands.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center max-w-sm mx-auto">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-4">
                  <Tag className="h-7 w-7 text-muted-foreground/50" />
                </div>
                <h2 className="text-sm font-semibold mb-1">Sem marcas</h2>
                <p className="text-xs text-muted-foreground mb-4">Crie marcas para organizar os produtos.</p>
                <Button size="sm" onClick={() => setCreateModalOpen(true)} className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Criar marca
                </Button>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {brands.map((brand: Brand) => (
                  <div
                    key={brand.id}
                    className="group relative rounded-xl border border-border bg-card p-4 hover:border-primary/30 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 overflow-hidden">
                        {brand.logo ? (
                          <img src={brand.logo} alt={brand.name} className="h-8 w-8 object-contain" />
                        ) : (
                          <Tag className="h-5 w-5 text-amber-600" />
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem onClick={() => { setSelectedBrand(brand); setCreateModalOpen(true) }}>
                            <Pencil className="h-3.5 w-3.5 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => handleDelete(brand, e)}
                            disabled={deletingBrandId === brand.id}
                          >
                            {deletingBrandId === brand.id ? (
                              <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5 mr-2" />
                            )}
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <h3 className="font-semibold text-sm text-foreground truncate mb-0.5">{brand.name}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                      <Globe className="h-3 w-3" />
                      <span className="truncate">{brand.slug}</span>
                    </div>

                    {brand.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{brand.description}</p>
                    )}

                    {brand.status && (
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${brandStatusClass(brand.status.code)}`}>
                        {brand.status.code}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      <CreateBrandModal
        open={createModalOpen}
        onOpenChange={(open) => {
          setCreateModalOpen(open)
          if (!open) setSelectedBrand(null)
        }}
        brand={selectedBrand}
        onSuccess={() => {
          refetch()
          setCreateModalOpen(false)
          setSelectedBrand(null)
        }}
      />
    </>
  )
}
