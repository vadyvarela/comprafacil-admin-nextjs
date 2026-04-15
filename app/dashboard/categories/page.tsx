"use client"

import { useState } from "react"
import { useQuery } from "@apollo/client/react"
import { GET_CATEGORIES } from "@/lib/graphql/categories/queries"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { PageToolbar } from "@/components/admin/page-toolbar"
import { CreateCategoryModal } from "@/components/categories/create-category-modal"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { FolderTree, Plus, Pencil, Trash2, MoreVertical, ChevronRight } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Category } from "@/lib/graphql/categories/types"

function categoryStatusClass(code: string | undefined): string {
  const c = code?.toUpperCase()
  if (c === "ACTIVE") return "badge-success"
  if (c === "INACTIVE" || c === "DISABLED") return "badge-neutral"
  return "badge-info"
}

export default function CategoriesPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)

  const { data, loading, error, refetch } = useQuery<{ categories: { data: Category[] } }>(
    GET_CATEGORIES,
    { variables: { page: { page: 0, size: 100 } } }
  )

  const categories = data?.categories?.data || []

  return (
    <>
      <DashboardHeader items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Categorias" }]} />
      <div className="flex flex-1 flex-col min-h-0">
        <PageToolbar
          icon={FolderTree}
          iconBg="bg-blue-500/10"
          iconColor="text-blue-400"
          title="Categorias"
          subtitle={loading ? "A carregar…" : `${categories.length} categoria${categories.length !== 1 ? "s" : ""}`}
        >
          <Button onClick={() => setCreateModalOpen(true)} size="sm" className="h-8 text-xs gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Nova categoria
          </Button>
        </PageToolbar>

        <div className="flex-1 overflow-auto p-5">
          {loading && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 text-xs">
              <p className="font-semibold text-destructive mb-1">Erro ao carregar</p>
              <p className="text-muted-foreground mb-3">{error.message}</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>Tentar novamente</Button>
            </div>
          )}

          {!loading && !error && (
            categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center max-w-sm mx-auto">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-4">
                  <FolderTree className="h-7 w-7 text-muted-foreground/40" />
                </div>
                <h2 className="text-sm font-semibold mb-1">Sem categorias</h2>
                <p className="text-xs text-muted-foreground mb-4">Crie categorias para organizar os produtos.</p>
                <Button size="sm" onClick={() => setCreateModalOpen(true)} className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Criar categoria
                </Button>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {categories.map((category: Category) => (
                  <div
                    key={category.id}
                    className="group relative rounded-xl border border-border bg-card p-4 hover:border-primary/20 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-xl">
                        {category.icon || <FolderTree className="h-5 w-5 text-blue-400" />}
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
                          <DropdownMenuItem onClick={() => { setSelectedCategory(category); setCreateModalOpen(true) }}>
                            <Pencil className="h-3.5 w-3.5 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive">
                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <h3 className="font-semibold text-sm text-foreground truncate mb-0.5">{category.name}</h3>
                    <p className="text-xs text-muted-foreground truncate mb-2 font-mono">{category.slug}</p>

                    {category.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{category.description}</p>
                    )}

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {category.status && (
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${categoryStatusClass(category.status.code)}`}>
                          {category.status.code}
                        </span>
                      )}
                      {category.parentCategory && (
                        <span className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground">
                          <ChevronRight className="h-3 w-3" />
                          {category.parentCategory.name}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      <CreateCategoryModal
        open={createModalOpen}
        onOpenChange={(open) => {
          setCreateModalOpen(open)
          if (!open) setSelectedCategory(null)
        }}
        category={selectedCategory}
        onSuccess={() => {
          refetch()
          setCreateModalOpen(false)
          setSelectedCategory(null)
        }}
      />
    </>
  )
}
