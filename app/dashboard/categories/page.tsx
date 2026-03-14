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
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">Carregando categorias...</p>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <DashboardHeader items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Categorias" }]} />
        <div className="bg-destructive/10 text-destructive p-4 rounded-md m-4">
          <p className="font-semibold">Erro ao carregar categorias</p>
          <p className="text-sm mt-1">{error.message}</p>
        </div>
      </>
    )
  }

  const categories = data?.categories?.data || []

  return (
    <>
      <DashboardHeader items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Categorias" }]} />
      <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Categorias</h1>
              <p className="text-muted-foreground">
                Gerencie as categorias de produtos
              </p>
            </div>
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Categoria
            </Button>
          </div>

          {categories.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FolderTree className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Nenhuma categoria cadastrada
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Crie categorias para organizar seus produtos
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCreateModalOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Categoria
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((category: Category) => (
                <Card key={category.id} className="hover:bg-accent/50 transition-colors group">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {category.icon && (
                          <span className="text-2xl">{category.icon}</span>
                        )}
                        <CardTitle className="text-lg">{category.name}</CardTitle>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-4 w-4" />
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
                    <CardDescription>
                      {category.slug}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {category.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {category.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      {category.status && (
                        <Badge variant="outline">
                          {category.status.code}
                        </Badge>
                      )}
                      {category.parentCategory && (
                        <Badge variant="secondary">
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

