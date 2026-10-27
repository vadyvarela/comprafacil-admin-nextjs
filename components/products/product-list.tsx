"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation } from "@apollo/client/react"
import Link from "next/link"
import Image from "next/image"
import {
  Package,
  Tag,
  MoreVertical,
  Trash2,
  Loader2,
  Eye,
  Globe,
  EyeOff,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useConfirmDialog } from "@/components/ui/confirm-dialog"
import { DataPanel } from "@/components/admin/data-panel"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DELETE_PRODUCT, UPDATE_PRODUCT } from "@/lib/graphql/products/mutations"
import type { Product } from "@/lib/graphql/products/types"
import { showToast } from "@/lib/utils/toast"
import { getErrorMessage } from "@/lib/utils/errors"
import { ProductPagination } from "@/components/products/product-pagination"
import {
  isProductDraft,
  productVisibilityLabel,
  productVisibilityToggleCode,
  productVisibilityToggleLabel,
  productVisibilityUpdateInput,
} from "@/lib/products/product-visibility"

type ProductMetadata = {
  sku?: string
}

type ProductListProps = {
  products: Product[]
  currentPage: number
  totalPages: number
  totalElements: number
  pageSize: number
  canWrite: boolean
}

export function ProductList({
  products,
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  canWrite,
}: ProductListProps) {
  const router = useRouter()
  const [busyProductId, setBusyProductId] = useState<string | null>(null)
  const { confirm, confirmDialog } = useConfirmDialog()
  const [deleteProduct] = useMutation(DELETE_PRODUCT)
  const [updateProduct] = useMutation(UPDATE_PRODUCT)

  // Seleção para acções em massa. Ids que já não estão na página (depois de
  // filtrar ou mudar de página) deixam de contar.
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulk, setBulk] = useState<{ label: string; done: number; total: number } | null>(null)
  const pageIds = products.map((p) => p.id)
  const selectedOnPage = products.filter((p) => selected.has(p.id))
  const allSelected = pageIds.length > 0 && selectedOnPage.length === pageIds.length
  const someSelected = selectedOnPage.length > 0 && !allSelected

  const toggleOne = (id: string) =>
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(pageIds))

  /** Publica (ACTIVE) ou passa a rascunho (INACTIVE) os selecionados, um a um. */
  const handleBulkVisibility = async (nextCode: string) => {
    const targets = selectedOnPage.filter((p) => isProductDraft(p.status?.code) !== isProductDraft(nextCode))
    const label = nextCode === "ACTIVE" ? "A publicar" : "A passar a rascunho"
    if (targets.length === 0) {
      showToast.success("Nada a mudar", `Os produtos selecionados já estão ${productVisibilityLabel(nextCode).toLowerCase()}s.`)
      return
    }
    let failed = 0
    setBulk({ label, done: 0, total: targets.length })
    for (const [i, product] of targets.entries()) {
      try {
        await updateProduct({
          variables: { id: product.id, input: productVisibilityUpdateInput(product, nextCode) },
        })
      } catch (err: unknown) {
        failed++
        console.error("Bulk visibility failed for", product.id, err)
      }
      setBulk({ label, done: i + 1, total: targets.length })
    }
    setBulk(null)
    setSelected(new Set())
    router.refresh()
    const ok = targets.length - failed
    const what = nextCode === "ACTIVE" ? "publicado(s)" : "passado(s) a rascunho"
    if (failed === 0) showToast.success("Feito", `${ok} produto(s) ${what}.`)
    else showToast.error("Alguns falharam", `${ok} ${what}, ${failed} com erro. Tente outra vez nesses.`)
  }

  const handleToggleVisibility = async (product: Product, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const nextCode = productVisibilityToggleCode(product.status?.code)
    const actionLabel = productVisibilityToggleLabel(product.status?.code)
    setBusyProductId(product.id)
    try {
      await updateProduct({
        variables: {
          id: product.id,
          input: productVisibilityUpdateInput(product, nextCode),
        },
      })
      router.refresh()
      showToast.success(
        nextCode === "ACTIVE" ? "Produto publicado" : "Produto em rascunho",
        `"${product.title}" foi marcado como ${productVisibilityLabel(nextCode).toLowerCase()}.`,
      )
    } catch (err: unknown) {
      console.error("Error toggling product visibility:", err)
      showToast.error(
        `Erro ao ${actionLabel.toLowerCase()}`,
        getErrorMessage(err, "Tente novamente."),
      )
    } finally {
      setBusyProductId(null)
    }
  }

  const handleDeleteProduct = async (
    productId: string,
    productTitle: string,
    e: React.MouseEvent
  ) => {
    e.preventDefault()
    e.stopPropagation()

    const confirmed = await confirm({
      title: "Eliminar produto?",
      description: `Está prestes a eliminar "${productTitle}".`,
      impact: "O produto e todas as suas variantes serão removidos da loja. Esta ação não pode ser desfeita.",
      confirmText: "Eliminar produto",
      variant: "critical",
      requireText: "ELIMINAR",
    })

    if (!confirmed) return

    setBusyProductId(productId)
    try {
      await deleteProduct({ variables: { id: productId } })
      router.refresh()
      showToast.success("Produto eliminado", `O produto "${productTitle}" foi eliminado com sucesso`)
    } catch (err: unknown) {
      console.error("Error deleting product:", err)
      const errorMessage = getErrorMessage(err, "Erro ao eliminar produto. Tente novamente.")
      showToast.error("Erro ao eliminar produto", errorMessage)
    } finally {
      setBusyProductId(null)
    }
  }

  return (
    <DataPanel>
      {canWrite && (selectedOnPage.length > 0 || bulk) ? (
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b border-border bg-muted/60 px-3 py-2 backdrop-blur">
          <span className="text-sm font-medium text-foreground">
            {bulk
              ? `${bulk.label} ${bulk.done}/${bulk.total}…`
              : `${selectedOnPage.length} selecionado(s)`}
          </span>
          {!bulk ? (
            <>
              <Button size="sm" className="h-8 gap-1.5" onClick={() => void handleBulkVisibility("ACTIVE")}>
                <Globe className="h-3.5 w-3.5" />
                Publicar
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5"
                onClick={() => void handleBulkVisibility("INACTIVE")}
              >
                <EyeOff className="h-3.5 w-3.5" />
                Passar a rascunho
              </Button>
              <Button size="sm" variant="ghost" className="h-8" onClick={() => setSelected(new Set())}>
                Limpar seleção
              </Button>
              {allSelected && totalElements > products.length ? (
                <span className="text-xs text-muted-foreground">
                  Só esta página: {products.length} de {totalElements}.
                </span>
              ) : null}
            </>
          ) : (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
      ) : null}
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-muted/45">
            {canWrite ? (
              <TableHead className="w-10 px-3">
                <input
                  type="checkbox"
                  aria-label="Selecionar todos os produtos desta página"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected
                  }}
                  onChange={toggleAll}
                  disabled={Boolean(bulk)}
                  className="size-4 cursor-pointer accent-primary align-middle"
                />
              </TableHead>
            ) : null}
            <TableHead className="w-14 text-xs">Img</TableHead>
            <TableHead className="text-xs">Produto</TableHead>
            <TableHead className="text-xs hidden sm:table-cell">Visibilidade</TableHead>
            <TableHead className="text-xs hidden md:table-cell">Categoria</TableHead>
            <TableHead className="text-xs hidden md:table-cell">Marca</TableHead>
            <TableHead className="text-xs hidden lg:table-cell">SKU</TableHead>
            <TableHead className="text-xs hidden sm:table-cell">Desconto</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            let metadata: ProductMetadata | null = null
            try {
              metadata = product.metadata ? (JSON.parse(product.metadata) as ProductMetadata) : null
            } catch {}

            const isBusy = busyProductId === product.id
            const draft = isProductDraft(product.status?.code)

            return (
              <TableRow
                key={product.id}
                data-state={selected.has(product.id) ? "selected" : undefined}
                className="group cursor-pointer hover:bg-muted/20"
              >
                {canWrite ? (
                  <TableCell className="w-10 py-2 px-3">
                    <input
                      type="checkbox"
                      aria-label={`Selecionar ${product.title}`}
                      checked={selected.has(product.id)}
                      onChange={() => toggleOne(product.id)}
                      disabled={Boolean(bulk)}
                      className="size-4 cursor-pointer accent-primary align-middle"
                    />
                  </TableCell>
                ) : null}
                <TableCell className="py-2 px-3">
                  <Link href={`/dashboard/products/${product.id}`} className="block">
                    <div className="h-10 w-10 rounded-lg border border-border bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                      {product.image ? (
                        <Image
                          src={product.image}
                          alt={product.title}
                          width={40}
                          height={40}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <Package className="h-4 w-4 text-muted-foreground/40" />
                      )}
                    </div>
                  </Link>
                </TableCell>

                <TableCell className="py-2">
                  <Link href={`/dashboard/products/${product.id}`} className="block">
                    <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {product.title}
                    </span>
                    {product.description && (
                      <span className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {product.description}
                      </span>
                    )}
                  </Link>
                </TableCell>

                <TableCell className="py-2 hidden sm:table-cell">
                  {draft ? (
                    <Badge
                      variant="outline"
                      className="text-xs h-5 px-1.5 text-warning-strong border-warning/40 bg-warning-soft"
                    >
                      {productVisibilityLabel(product.status?.code)}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs h-5 px-1.5">
                      {productVisibilityLabel(product.status?.code)}
                    </Badge>
                  )}
                </TableCell>

                <TableCell className="py-2 hidden md:table-cell">
                  {product.category ? (
                    <Badge variant="secondary" className="text-xs h-5 px-1.5">
                      {product.category.name}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground/40">—</span>
                  )}
                </TableCell>

                <TableCell className="py-2 hidden md:table-cell">
                  {product.brand ? (
                    <Badge variant="outline" className="text-xs h-5 px-1.5 font-normal">
                      {product.brand.name}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground/40">—</span>
                  )}
                </TableCell>

                <TableCell className="py-2 hidden lg:table-cell">
                  {metadata?.sku ? (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                      <Tag className="h-3 w-3" />
                      {metadata.sku}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground/40">—</span>
                  )}
                </TableCell>

                <TableCell className="py-2 hidden sm:table-cell">
                  {product.discount ? (
                    <Badge
                      variant="outline"
                      className="text-xs h-5 px-1.5 text-success border-success/30"
                    >
                      {product.discount}%
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground/40">—</span>
                  )}
                </TableCell>

                <TableCell className="py-2 pr-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        disabled={isBusy}
                      >
                        {isBusy ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <MoreVertical className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/dashboard/products/${product.id}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Eye className="h-3.5 w-3.5 mr-2" />
                          Ver produto
                        </Link>
                      </DropdownMenuItem>
                      {canWrite ? (
                        <>
                          <DropdownMenuItem
                            onClick={(e) => handleToggleVisibility(product, e)}
                            disabled={isBusy}
                          >
                            {draft ? (
                              <Globe className="h-3.5 w-3.5 mr-2" />
                            ) : (
                              <EyeOff className="h-3.5 w-3.5 mr-2" />
                            )}
                            {productVisibilityToggleLabel(product.status?.code)}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => handleDeleteProduct(product.id, product.title, e)}
                            disabled={isBusy}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      <ProductPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalElements={totalElements}
        pageSize={pageSize}
      />
      {confirmDialog}
    </DataPanel>
  )
}
