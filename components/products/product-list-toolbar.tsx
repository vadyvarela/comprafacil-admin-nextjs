"use client"

import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { FileJson, Package, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PageToolbar } from "@/components/admin/page-toolbar"
import { CreateProductModal } from "@/components/products/create-product-modal"
import {
  formatCategoryLabel,
  sortCategoriesForSelect,
} from "@/lib/categories/format-category-label"
import {
  FILTER_ALL,
  FILTER_NONE,
  type ProductBrandOption,
  type ProductCategoryOption,
} from "@/lib/products/list-filters"

type ProductListToolbarProps = {
  totalElements: number
  error?: string | null
  hasActiveFilters: boolean
  categories: ProductCategoryOption[]
  brands: ProductBrandOption[]
}

export function ProductListToolbar({
  totalElements,
  error,
  hasActiveFilters,
  categories,
  brands,
}: ProductListToolbarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [createModalOpen, setCreateModalOpen] = useState(false)

  const searchParamsRef = useRef(searchParams)
  searchParamsRef.current = searchParams

  const searchFromUrl = searchParams.get("search") ?? ""
  const category = searchParams.get("category") ?? FILTER_ALL
  const brand = searchParams.get("brand") ?? FILTER_ALL
  const status = searchParams.get("status") ?? FILTER_ALL

  const [searchQuery, setSearchQuery] = useState(searchFromUrl)

  useEffect(() => {
    setSearchQuery(searchFromUrl)
  }, [searchFromUrl])

  const navigate = useCallback(
    (overrides: Record<string, string | null>) => {
      const p = new URLSearchParams(searchParamsRef.current.toString())
      p.set("page", "0")
      for (const [key, value] of Object.entries(overrides)) {
        if (value == null || value === "" || value === FILTER_ALL) p.delete(key)
        else p.set(key, value)
      }
      const qs = p.toString()
      startTransition(() => {
        router.push(qs ? `?${qs}` : "/dashboard/products")
      })
    },
    [router, startTransition]
  )

  useEffect(() => {
    const t = setTimeout(() => {
      const next = searchQuery.trim()
      if (next === searchFromUrl.trim()) return
      navigate({ search: next || null })
    }, 350)
    return () => clearTimeout(t)
  }, [searchQuery, searchFromUrl, navigate])

  const categoryFilterOptions = sortCategoriesForSelect(categories)
  const brandFilterOptions = [...brands].sort((a, b) => a.name.localeCompare(b.name, "pt"))

  const subtitle =
    error
      ? "Erro ao carregar"
      : hasActiveFilters
        ? `${totalElements} produto${totalElements !== 1 ? "s" : ""} encontrado${totalElements !== 1 ? "s" : ""}`
        : `${totalElements} produto${totalElements !== 1 ? "s" : ""} no catálogo`

  return (
    <>
      <PageToolbar
        icon={Package}
        iconBg="bg-indigo-500/10"
        iconColor="text-indigo-400"
        title="Produtos"
        subtitle={isPending ? "A pesquisar…" : subtitle}
      >
        <div className="flex flex-wrap items-center gap-2">
          <form
            method="GET"
            className="contents"
            role="search"
            aria-label="Pesquisar produtos"
            onSubmit={(e) => {
              e.preventDefault()
              navigate({ search: searchQuery.trim() || null })
            }}
          >
            <div className="relative w-44 sm:w-52">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                name="search"
                placeholder="Título, descrição, SKU…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
          </form>
          <Select value={category} onValueChange={(value) => navigate({ category: value })}>
            <SelectTrigger className="h-8 w-[140px] text-xs" aria-label="Filtrar por categoria">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={FILTER_ALL} className="text-xs">
                Todas as categorias
              </SelectItem>
              <SelectItem value={FILTER_NONE} className="text-xs">
                Sem categoria
              </SelectItem>
              {categoryFilterOptions.map((c) => (
                <SelectItem key={c.id} value={c.id} className="text-xs">
                  {formatCategoryLabel(c)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={brand} onValueChange={(value) => navigate({ brand: value })}>
            <SelectTrigger className="h-8 w-[130px] text-xs" aria-label="Filtrar por marca">
              <SelectValue placeholder="Marca" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={FILTER_ALL} className="text-xs">
                Todas as marcas
              </SelectItem>
              <SelectItem value={FILTER_NONE} className="text-xs">
                Sem marca
              </SelectItem>
              {brandFilterOptions.map((b) => (
                <SelectItem key={b.id} value={b.id} className="text-xs">
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(value) => navigate({ status: value })}>
            <SelectTrigger className="h-8 w-[120px] text-xs" aria-label="Filtrar por visibilidade">
              <SelectValue placeholder="Visibilidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={FILTER_ALL} className="text-xs">
                Todos
              </SelectItem>
              <SelectItem value="ACTIVE" className="text-xs">
                Ativos
              </SelectItem>
              <SelectItem value="INACTIVE" className="text-xs">
                Rascunhos
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" asChild>
          <Link href="/dashboard/products/importar">
            <FileJson className="h-3.5 w-3.5" />
            Importar JSON
          </Link>
        </Button>
        <Button onClick={() => setCreateModalOpen(true)} size="sm" className="h-8 text-xs gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Novo produto
        </Button>
      </PageToolbar>

      {error && (
        <div className="mx-5 mt-4 p-4 rounded-lg border border-destructive/30 bg-destructive/5 text-xs">
          <p className="font-semibold text-destructive mb-1">Erro ao carregar produtos</p>
          <p className="text-muted-foreground mb-3">{error}</p>
          <Button variant="outline" size="sm" onClick={() => router.refresh()}>
            Tentar novamente
          </Button>
        </div>
      )}

      <CreateProductModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
    </>
  )
}
