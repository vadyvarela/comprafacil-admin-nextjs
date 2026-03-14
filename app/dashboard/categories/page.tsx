"use client"

import { useState } from "react"
import { useQuery } from "@apollo/client/react"
import { GET_CATEGORIES } from "@/lib/graphql/categories/queries"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { CreateCategoryModal } from "@/components/categories/create-category-modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FolderTree, Plus, Pencil, Trash2, MoreVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Category } from "@/lib/graphql/categories/types"

export default function CategoriesPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)

  const { data, loading, error, refetch } = useQuery<{
    categories: { data: Category[] }
  }>(GET_CATEGORIES, {
    variables: {
      page: { page: 0, size: 100 },
    },
  })

  if (loading) {
    return (
      <>
        <DashboardHeader items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Categorias" }]} />
        <div className="border-b border-border bg-card px-4 py-2.5">
          <h1 className="text-base font-semibold tracking-tight">Categorias</h1>
          <p className="text-xs text-muted-foreground mt-0.5">A carregar…</p>
        </div>
        <div className="flex flex-1 items-center justify-center p-8">
          <p className="text-sm text-muted-foreground">A carregar categorias…</p>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <DashboardHeader items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Categorias" }]} />
        <div className="border-b border-border bg-card px-4 py-2.5">
          <h1 className="text-base font-semibold tracking-tight">Categorias</h1>
        </div>
        <div className="p-4">
          <div className="p-2.5 rounded-md border border-destructive/50 bg-destructive/10 text-xs">
            <p className="font-medium text-destructive">Erro ao carregar</p>
            <p className="text-muted-foreground mt-1">{error.message}</p>
          </div>
        </div>
      </>
    )
  }

  const categories = data?.categories?.data || []

  return (
    <>
      <DashboardHeader items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Categorias" }]} />
      <div className="flex flex-1 flex-col min-h-0">
        <div className="border-b border-border bg-card">
          <div className="px-4 py-2.5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-base font-semibold tracking-tight">Categorias</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {categories.length} categoria{categories.length !== 1 ? "s" : ""}
                </p>
              </div>
              <Button onClick={() => setCreateModalOpen(true)} size="sm" className="h-8 text-xs">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Nova categoria
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 md:p-6">
          {categories.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-sm mx-auto"
              role="status"
              aria-label="Nenhuma categoria"
            >
              <FolderTree className="h-10 w-10 text-muted-foreground mb-4" />
              <h2 className="text-sm font-semibold text-foreground mb-1">Nenhuma categoria</h2>
              <p className="text-xs text-muted-foreground mb-4">
                Crie categorias para organizar os produtos.
              </p>
              <Button variant="outline" size="sm" onClick={() => setCreateModalOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Criar categoria
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((category: Category) => (
                <Card key={category.id} className="hover:bg-accent/50 transition-colors group border-border">
                  <CardHeader className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        {category.icon && (
                          <span className="text-lg shrink-0">{category.icon}</span>
                        )}
                        <CardTitle className="text-sm font-semibold truncate">{category.name}</CardTitle>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedCategory(category)
                              setCreateModalOpen(true)
                            }}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardDescription className="text-xs">
                      {category.slug}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    {category.description && (
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {category.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {category.status && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0">
                          {category.status.code}
                        </Badge>
                      )}
                      {category.parentCategory && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0">
                          {category.parentCategory.name}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateCategoryModal
          open={createModalOpen}
          onOpenChange={(open) => {
            setCreateModalOpen(open)
            if (!open) {
              setSelectedCategory(null)
            }
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

