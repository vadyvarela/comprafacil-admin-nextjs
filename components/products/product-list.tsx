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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { DELETE_PRODUCT } from "@/lib/graphql/products/mutations"
import type { Product } from "@/lib/graphql/products/types"
import { showToast } from "@/lib/utils/toast"
import { getErrorMessage } from "@/lib/utils/errors"
import { ProductPagination } from "@/components/products/product-pagination"

type ProductMetadata = {
  sku?: string
}

type ProductListProps = {
  products: Product[]
  currentPage: number
  totalPages: number
  totalElements: number
  pageSize: number
}

export function ProductList({
  products,
  currentPage,
  totalPages,
  totalElements,
  pageSize,
}: ProductListProps) {
  const router = useRouter()
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null)
  const [deleteProduct] = useMutation(DELETE_PRODUCT)

  const handleDeleteProduct = async (
    productId: string,
    productTitle: string,
    e: React.MouseEvent
  ) => {
    e.preventDefault()
    e.stopPropagation()

    if (
      !confirm(
        `Tem certeza que deseja excluir o produto "${productTitle}"?\n\nEsta ação irá excluir o produto e todas as suas variantes. Esta ação não pode ser desfeita.`
      )
    ) {
      return
    }

    setDeletingProductId(productId)
    try {
      await deleteProduct({ variables: { id: productId } })
      router.refresh()
      showToast.success("Produto excluído", `O produto "${productTitle}" foi excluído com sucesso`)
    } catch (err: unknown) {
      console.error("Error deleting product:", err)
      const errorMessage = getErrorMessage(err, "Erro ao excluir produto. Tente novamente.")
      showToast.error("Erro ao excluir produto", errorMessage)
    } finally {
      setDeletingProductId(null)
    }
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-border/60 bg-background hover:bg-background">
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

            const isDeleting = deletingProductId === product.id

            return (
              <TableRow key={product.id} className="group cursor-pointer hover:bg-muted/20">
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
                      <span className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                        {product.description}
                      </span>
                    )}
                  </Link>
                </TableCell>

                <TableCell className="py-2 hidden sm:table-cell">
                  {product.status?.code === "INACTIVE" ? (
                    <Badge
                      variant="outline"
                      className="text-[11px] h-5 px-1.5 text-amber-700 border-amber-500/40 bg-amber-50"
                    >
                      Rascunho
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[11px] h-5 px-1.5">
                      Ativo
                    </Badge>
                  )}
                </TableCell>

                <TableCell className="py-2 hidden md:table-cell">
                  {product.category ? (
                    <Badge variant="secondary" className="text-[11px] h-5 px-1.5">
                      {product.category.name}
                    </Badge>
                  ) : (
                    <span className="text-[11px] text-muted-foreground/40">—</span>
                  )}
                </TableCell>

                <TableCell className="py-2 hidden md:table-cell">
                  {product.brand ? (
                    <Badge variant="outline" className="text-[11px] h-5 px-1.5 font-normal">
                      {product.brand.name}
                    </Badge>
                  ) : (
                    <span className="text-[11px] text-muted-foreground/40">—</span>
                  )}
                </TableCell>

                <TableCell className="py-2 hidden lg:table-cell">
                  {metadata?.sku ? (
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                      <Tag className="h-3 w-3" />
                      {metadata.sku}
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground/40">—</span>
                  )}
                </TableCell>

                <TableCell className="py-2 hidden sm:table-cell">
                  {product.discount ? (
                    <Badge
                      variant="outline"
                      className="text-[11px] h-5 px-1.5 text-emerald-400 border-emerald-500/30"
                    >
                      {product.discount}%
                    </Badge>
                  ) : (
                    <span className="text-[11px] text-muted-foreground/40">—</span>
                  )}
                </TableCell>

                <TableCell className="py-2 pr-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <MoreVertical className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/dashboard/products/${product.id}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Eye className="h-3.5 w-3.5 mr-2" />
                          Ver produto
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={(e) => handleDeleteProduct(product.id, product.title, e)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        Excluir
                      </DropdownMenuItem>
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
    </div>
  )
}
