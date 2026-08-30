"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery } from "@apollo/client/react"
import { GET_CATEGORIES } from "@/lib/graphql/categories/queries"
import { DELETE_CATEGORY } from "@/lib/graphql/categories/mutations"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { PageToolbar } from "@/components/admin/page-toolbar"
import { CreateCategoryModal } from "@/components/categories/create-category-modal"
import { CategoryTree } from "@/components/categories/category-tree"
import { Button } from "@/components/ui/button"
import { useConfirmDialog } from "@/components/ui/confirm-dialog"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/admin/empty-state"
import { FolderTree, Plus, Search } from "lucide-react"
import { Category } from "@/lib/graphql/categories/types"
import { groupCategoriesByParent } from "@/lib/categories/format-category-label"
import { showToast } from "@/lib/utils/toast"
import { getErrorMessage } from "@/lib/utils/errors"

export default function CategoriesPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { confirm, confirmDialog } = useConfirmDialog()

  const { data, loading, error, refetch } = useQuery<{
    categories: { data: Category[] }
  }>(GET_CATEGORIES, {
    variables: { filter: null, page: { page: 0, size: 100 } },
  })

  const [deleteCategory] = useMutation(DELETE_CATEGORY)

  const categories = useMemo(() => data?.categories?.data ?? [], [data?.categories?.data])
  const groups = useMemo(() => groupCategoriesByParent(categories), [categories])
  const rootCount = groups.length
  const subCount = Math.max(0, categories.length - rootCount)

  const openCreate = () => {
    setSelectedCategory(null)
    setCreateModalOpen(true)
  }

  const openEdit = (category: Category) => {
    setSelectedCategory(category)
    setCreateModalOpen(true)
  }

  const handleDelete = async (category: Category, childCount: number) => {
    const confirmed = await confirm({
      title: "Eliminar categoria?",
      description: `Está prestes a eliminar "${category.name}".`,
      impact:
        childCount > 0
          ? `Esta categoria tem ${childCount} subcategoria${childCount !== 1 ? "s" : ""}. A ação não pode ser desfeita.`
          : "A categoria será removida do catálogo. Esta ação não pode ser desfeita.",
      confirmText: "Eliminar categoria",
      variant: "destructive",
    })

    if (!confirmed) return

    setDeletingId(category.id)
    try {
      await deleteCategory({ variables: { id: category.id } })
      await refetch()
      showToast.success("Categoria eliminada", `"${category.name}" foi eliminada`)
    } catch (err: unknown) {
      showToast.error("Erro ao eliminar", getErrorMessage(err, "Não foi possível eliminar a categoria."))
    } finally {
      setDeletingId(null)
    }
  }

  const subtitle = loading
    ? "A carregar…"
    : subCount > 0
      ? `${rootCount} ${rootCount === 1 ? "principal" : "principais"} · ${subCount} sub`
      : `${categories.length} categoria${categories.length !== 1 ? "s" : ""}`

  return (
    <>
      <DashboardHeader
        items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Categorias" }]}
      />
      <div className="flex flex-1 flex-col min-h-0">
        <PageToolbar
          icon={FolderTree}
          iconBg="bg-blue-50"
          iconColor="text-blue-800"
          title="Categorias"
          subtitle={subtitle}
        >
          <div className="relative w-full sm:w-56">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrar categorias…"
              className="h-8 pl-8 text-xs"
              aria-label="Filtrar categorias"
            />
          </div>
          <Button onClick={openCreate} size="sm" className="h-8 text-xs gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Nova categoria
          </Button>
        </PageToolbar>

        <div className="flex-1 overflow-auto p-4 md:p-5 bg-background">
          {loading && (
            <div className="overflow-hidden rounded-lg border border-border bg-card shadow-xs">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 border-b border-border/60 px-3 py-2.5 last:border-0"
                >
                  <Skeleton className="h-9 w-9 rounded-md" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-40" />
                    <Skeleton className="h-2.5 w-24" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/5 text-xs">
              <p className="font-semibold text-destructive mb-1">Erro ao carregar categorias</p>
              <p className="text-muted-foreground mb-3">{error.message}</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Tentar novamente
              </Button>
            </div>
          )}

          {!loading && !error && (
            categories.length === 0 ? (
              <EmptyState
                icon={FolderTree}
                title="Sem categorias"
                description="Organize o catálogo em grupos principais e subcategorias."
                tone="info"
                action={
                  <Button size="sm" onClick={openCreate} className="gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    Criar categoria
                  </Button>
                }
              />
            ) : (
              <CategoryTree
                groups={groups}
                query={searchQuery}
                deletingId={deletingId}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
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
      {confirmDialog}
    </>
  )
}
