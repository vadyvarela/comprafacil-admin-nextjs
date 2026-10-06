"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useQuery } from "@apollo/client/react"
import { ArrowLeft, Package } from "lucide-react"
import { GET_PRODUCT, GET_PRODUCTS } from "@/lib/graphql/products/queries"
import type { Product } from "@/lib/graphql/products/types"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { EmptyState } from "@/components/admin/empty-state"
import { ProductEditForm } from "@/components/products/product-edit-form"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useConfirmDialog } from "@/components/ui/confirm-dialog"

export default function EditProductPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string
  const detailHref = `/dashboard/products/${productId}`
  const [dirty, setDirty] = useState(false)
  const { confirm, confirmDialog } = useConfirmDialog()

  const { data, loading, error } = useQuery<{ productDetails?: Product }>(GET_PRODUCT, {
    variables: { id: productId },
    skip: !productId,
  })

  // productDetails às vezes chega sem marca; a lista tem-na. Herdado do modal.
  const { data: productsData } = useQuery<{
    products?: { data?: Array<{ id: string; brand?: Product["brand"] }> }
  }>(GET_PRODUCTS, {
    variables: {
      filter: { includeInactive: true },
      page: { page: 0, size: 1000, sortBy: "createdAt", sortDirection: "DESC" },
    },
    skip: !productId,
  })

  const product = data?.productDetails
  const fallbackBrand = productsData?.products?.data?.find((item) => item.id === product?.id)?.brand
  // Memo: um objecto novo a cada render faria o formulário voltar ao início.
  const productForEditing = useMemo(
    () => (product ? { ...product, brand: product.brand ?? fallbackBrand ?? null } : null),
    [product, fallbackBrand]
  )

  // Fechar o separador ou recarregar com alterações por guardar.
  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [dirty])

  const leave = useCallback(async () => {
    if (dirty) {
      const confirmed = await confirm({
        title: "Sair sem guardar?",
        description: "As alterações a este produto perdem-se.",
        confirmText: "Sair sem guardar",
        cancelText: "Continuar a editar",
        variant: "destructive",
      })
      if (!confirmed) return
    }
    router.push(detailHref)
  }, [confirm, detailHref, dirty, router])

  const title = product?.title ?? "Produto"

  return (
    <>
      <DashboardHeader
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Produtos", href: "/dashboard/products" },
          { label: title, href: detailHref },
          { label: "Editar" },
        ]}
      />
      <div className="flex flex-1 flex-col bg-background">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-5 pt-6 md:px-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => void leave()} aria-label="Voltar ao produto">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold">Editar produto</h1>
              <p className="truncate text-xs text-muted-foreground">
                {loading ? "A carregar…" : title}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3.5">
              <Skeleton className="h-28 rounded-lg" />
              <Skeleton className="h-48 rounded-lg" />
              <Skeleton className="h-48 rounded-lg" />
            </div>
          ) : error || !productForEditing ? (
            <EmptyState
              icon={Package}
              tone={error ? "danger" : "neutral"}
              title={error ? "Erro ao carregar produto" : "Produto não encontrado"}
              description={error?.message}
              action={
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/products">Voltar aos produtos</Link>
                </Button>
              }
            />
          ) : (
            <ProductEditForm
              product={productForEditing}
              onDirtyChange={setDirty}
              onCancel={() => void leave()}
              onSaved={() => router.push(detailHref)}
            />
          )}
        </div>
      </div>
      {confirmDialog}
    </>
  )
}
