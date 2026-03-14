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
        <div className="border-b border-border bg-card px-4 py-2.5">
          <h1 className="text-base font-semibold tracking-tight">Marcas</h1>
          <p className="text-xs text-muted-foreground mt-0.5">A carregar…</p>
        </div>
        <div className="flex flex-1 items-center justify-center p-8">
          <p className="text-sm text-muted-foreground">A carregar marcas…</p>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <DashboardHeader items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Marcas" }]} />
        <div className="border-b border-border bg-card px-4 py-2.5">
          <h1 className="text-base font-semibold tracking-tight">Marcas</h1>
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

  const brands = data?.brands?.data || []

  return (
    <>
      <DashboardHeader items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Marcas" }]} />
      <div className="flex flex-1 flex-col min-h-0">
        <div className="border-b border-border bg-card">
          <div className="px-4 py-2.5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-base font-semibold tracking-tight">Marcas</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {brands.length} marca{brands.length !== 1 ? "s" : ""}
                </p>
              </div>
              <Button onClick={() => setCreateModalOpen(true)} size="sm" className="h-8 text-xs">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Nova marca
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 md:p-6">
          {brands.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-sm mx-auto"
              role="status"
              aria-label="Nenhuma marca"
            >
              <Tag className="h-10 w-10 text-muted-foreground mb-4" />
              <h2 className="text-sm font-semibold text-foreground mb-1">Nenhuma marca</h2>
              <p className="text-xs text-muted-foreground mb-4">
                Crie marcas para organizar os produtos.
              </p>
              <Button variant="outline" size="sm" onClick={() => setCreateModalOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Criar marca
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {brands.map((brand: Brand) => (
                <Card key={brand.id} className="hover:bg-accent/50 transition-colors group border-border">
                  <CardHeader className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 min-w-0">
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

