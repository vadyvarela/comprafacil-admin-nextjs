"use client"

import { useMemo, useState } from "react"
import { useMutation } from "@apollo/client/react"
import { UPDATE_PRODUCT } from "@/lib/graphql/products/mutations"
import { GET_PRODUCT } from "@/lib/graphql/products/queries"
import type { Product, ProductVariant } from "@/lib/graphql/products/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataPanel } from "@/components/admin/data-panel"
import { showToast } from "@/lib/utils/toast"
import { getErrorMessage } from "@/lib/utils/errors"
import {
  deriveOptionCatalogFromVariants,
  mergeProductMetadataAttributes,
  optionCatalogsMatch,
  parseProductOptionCatalog,
  type OptionCatalogEntry,
} from "@/lib/products/option-catalog"
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, Store } from "lucide-react"

interface ProductOptionCatalogPanelProps {
  product: Product
  variants: ProductVariant[]
  onSynced?: () => void
}

function CatalogBlock({
  title,
  catalog,
  emptyLabel,
}: {
  title: string
  catalog: OptionCatalogEntry[]
  emptyLabel: string
}) {
  return (
    <div className="rounded-md border border-border/70 bg-muted/15 p-3 space-y-2">
      <p className="text-[11px] font-medium text-muted-foreground uppercase">
        {title}
      </p>
      {catalog.length === 0 ? (
        <p className="text-xs text-muted-foreground">{emptyLabel}</p>
      ) : (
        catalog.map((entry) => (
          <div key={entry.name} className="space-y-1.5">
            <p className="text-xs font-semibold">{entry.name}</p>
            <div className="flex flex-wrap gap-1.5">
              {entry.values.map((value) => (
                <Badge key={value} variant="secondary" className="text-[10px] font-normal">
                  {value}
                </Badge>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

export function ProductOptionCatalogPanel({
  product,
  variants,
  onSynced,
}: ProductOptionCatalogPanelProps) {
  const [syncing, setSyncing] = useState(false)

  const productCatalog = useMemo(
    () => parseProductOptionCatalog(product.metadata),
    [product.metadata],
  )
  const variantCatalog = useMemo(
    () => deriveOptionCatalogFromVariants(variants),
    [variants],
  )
  const aligned = useMemo(
    () => optionCatalogsMatch(productCatalog, variantCatalog),
    [productCatalog, variantCatalog],
  )

  const [updateProduct] = useMutation(UPDATE_PRODUCT, {
    refetchQueries: [{ query: GET_PRODUCT, variables: { id: product.id } }],
  })

  const handleSync = async () => {
    if (variantCatalog.length === 0) {
      showToast.error("Sem variantes", "Define variantes com opções antes de sincronizar.")
      return
    }

    setSyncing(true)
    try {
      const metadata = mergeProductMetadataAttributes(product.metadata, variantCatalog)
      const productType = product.type ? { code: product.type.code } : { code: "TICKET" }

      await updateProduct({
        variables: {
          id: product.id,
          input: {
            title: product.title,
            summary: product.summary ?? null,
            discount: product.discount ?? null,
            condition: product.condition ?? "novo",
            type: productType,
            status: product.status?.code ? { code: product.status.code } : { code: "ACTIVE" },
            metadata,
            categoryId: product.category?.id ?? null,
            brandId: product.brand?.id ?? null,
          },
        },
      })

      showToast.success(
        "Catálogo sincronizado",
        "O selector da loja passará a usar as opções das variantes.",
      )
      onSynced?.()
    } catch (error: unknown) {
      showToast.error("Erro", getErrorMessage(error, "Não foi possível sincronizar o catálogo."))
    } finally {
      setSyncing(false)
    }
  }

  if (variants.length <= 1 && productCatalog.length === 0) {
    return null
  }

  return (
    <DataPanel>
      <div className="flex items-start justify-between gap-3 border-b border-border/80 bg-muted/35 px-4 py-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/60 bg-amber-50">
            <Store className="h-4 w-4 text-amber-800" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold">Opções na loja</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
              A página de detalhe usa <code className="text-[10px]">metadata.attributes</code> do
              produto. Deve coincidir com as opções das variantes.
            </p>
          </div>
        </div>
        {aligned ? (
          <Badge
            variant="outline"
            className="shrink-0 text-[10px] border-emerald-500/40 bg-emerald-50 text-emerald-800"
          >
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Alinhado
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="shrink-0 text-[10px] border-amber-500/40 bg-amber-50 text-amber-800"
          >
            <AlertTriangle className="h-3 w-3 mr-1" />
            Desalinhado
          </Badge>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <CatalogBlock
            title="No produto (loja lê isto)"
            catalog={productCatalog}
            emptyLabel="Não definido — a loja tenta derivar das variantes."
          />
          <CatalogBlock
            title="Das variantes (esperado)"
            catalog={variantCatalog}
            emptyLabel="Nenhuma opção nas variantes."
          />
        </div>

        {!aligned && variantCatalog.length > 0 && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-md border border-amber-500/30 bg-amber-50/60 px-3 py-2.5">
            <p className="text-[11px] text-amber-900 leading-relaxed">
              O catálogo do produto não coincide com as variantes. Isto pode fazer o selector da
              loja mostrar opções erradas (ex.: TIPO em vez de Modelo).
            </p>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 h-8 text-xs border-amber-500/40 bg-white hover:bg-amber-50"
              onClick={() => void handleSync()}
              disabled={syncing}
            >
              {syncing ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              )}
              Sincronizar
            </Button>
          </div>
        )}
      </div>
    </DataPanel>
  )
}
