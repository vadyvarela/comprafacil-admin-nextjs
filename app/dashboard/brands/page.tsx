"use client"

import { useState } from "react"
import { useQuery } from "@apollo/client/react"
import { GET_BRANDS } from "@/lib/graphql/brands/queries"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { CreateBrandModal } from "@/components/brands/create-brand-modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tag, Plus, Pencil, Trash2, MoreVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Brand } from "@/lib/graphql/brands/types"

export default function BrandsPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)

  const { data, loading, error, refetch } = useQuery<{
    brands: { data: Brand[] }
  }>(GET_BRANDS, {
    variables: {
      page: { page: 0, size: 100 },
    },
  })

  if (loading) {
    return (
      <>
        <DashboardHeader items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Marcas" }]} />
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">Carregando marcas...</p>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <DashboardHeader items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Marcas" }]} />
        <div className="bg-destructive/10 text-destructive p-4 rounded-md m-4">
          <p className="font-semibold">Erro ao carregar marcas</p>
          <p className="text-sm mt-1">{error.message}</p>
        </div>
      </>
    )
  }

  const brands = data?.brands?.data || []

  return (
    <>
      <DashboardHeader items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Marcas" }]} />
      <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Marcas</h1>
              <p className="text-muted-foreground">
                Gerencie as marcas de produtos
              </p>
            </div>
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Marca
            </Button>
          </div>

          {brands.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Nenhuma marca cadastrada
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Crie marcas para organizar seus produtos
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCreateModalOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Marca
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {brands.map((brand: Brand) => (
                <Card key={brand.id} className="hover:bg-accent/50 transition-colors group">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {brand.logo && (
                          <img 
                            src={brand.logo} 
                            alt={brand.name}
                            className="w-8 h-8 object-contain"
                          />
                        )}
                        <CardTitle className="text-lg">{brand.name}</CardTitle>
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
                              setSelectedBrand(brand)
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
                      {brand.slug}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {brand.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {brand.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      {brand.status && (
                        <Badge variant="outline">
                          {brand.status.code}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <CreateBrandModal
          open={createModalOpen}
          onOpenChange={(open) => {
            setCreateModalOpen(open)
            if (!open) {
              setSelectedBrand(null)
            }
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

