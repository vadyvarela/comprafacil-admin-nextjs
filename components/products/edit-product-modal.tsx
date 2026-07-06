"use client"

import { useState, useEffect, useMemo } from "react"
import { useMutation, useQuery } from "@apollo/client/react"
import { UPDATE_PRODUCT } from "@/lib/graphql/products/mutations"
import { GET_PRODUCT, GET_PRODUCTS } from "@/lib/graphql/products/queries"
import { GET_CATEGORY_LIST } from "@/lib/graphql/categories/queries"
import { GET_BRAND_LIST } from "@/lib/graphql/brands/queries"
import { Product } from "@/lib/graphql/products/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Package, FileText, Layers, Puzzle } from "lucide-react"
import { showToast } from "@/lib/utils/toast"
import { RichTextEditor } from "../ui/rich-text-editor"
import { looksLikeIphoneProduct, normalizeBatteryHealthPercent } from "@/lib/utils/iphone-seminovo-metadata"
import { CuratedProductPicker } from "@/components/store-home/curated-product-picker"
import { Field, FormSection } from "@/components/products/product-form-layout"
import { ProductSpecsSection } from "@/components/products/product-specs-lookup"
import { isSmartphoneCategory } from "@/lib/product-specs/is-smartphone-category"
import {
  parseSpecificationsFromMetadata,
  specificationsToMetadataField,
} from "@/lib/product-specs/map-mobileapi-to-specifications"
import type { ProductSpecifications } from "@/lib/product-specs/types"

interface EditProductModalProps {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

type CategoryOption = { id: string; name: string; slug: string }
type BrandOption = { id: string; name: string; slug: string }

export function EditProductModal({
  product,
  open,
  onOpenChange,
}: EditProductModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    discount: "",
    condition: "novo",
    sku: "",
    categoryId: "",
    brandId: "",
    semFaceId: false,
    batteryHealthPercent: "",
    addOnProductIds: [] as string[],
    specifications: {} as ProductSpecifications,
  })

  const { data: categoriesData } = useQuery(GET_CATEGORY_LIST, {
    skip: !open,
  })

  const { data: brandsData } = useQuery(GET_BRAND_LIST, {
    skip: !open,
  })

  const categories: CategoryOption[] = useMemo(
    () => (categoriesData as { categoryList?: CategoryOption[] } | undefined)?.categoryList ?? [],
    [categoriesData]
  )
  const brands: BrandOption[] = useMemo(
    () => (brandsData as { brandList?: BrandOption[] } | undefined)?.brandList ?? [],
    [brandsData]
  )

  const [updateProduct, { loading, error }] = useMutation(UPDATE_PRODUCT, {
    refetchQueries: [
      { query: GET_PRODUCTS },
      { query: GET_PRODUCT, variables: { id: product?.id } },
    ],
    onCompleted: () => {
      showToast.success("Produto atualizado", "As alterações foram salvas com sucesso")
      onOpenChange(false)
    },
  })

  useEffect(() => {
    if (product && open) {
      let metadata: Record<string, unknown> | null = null
      try {
        metadata = product.metadata ? JSON.parse(product.metadata) : null
      } catch {
        /* ignore */
      }

      // eslint-disable-next-line react-hooks/set-state-in-effect -- preencher formulário ao abrir o modal
      setFormData({
        title: product.title || "",
        summary: product.summary || "",
        discount: product.discount?.toString() || "",
        condition: product.condition || "novo",
        sku: typeof metadata?.sku === "string" ? metadata.sku : "",
        categoryId: product.category?.id || "none",
        brandId: product.brand?.id || "none",
        semFaceId: metadata?.semFaceId === true,
        batteryHealthPercent:
          metadata?.batteryHealthPercent !== undefined && metadata?.batteryHealthPercent !== null
            ? String(metadata.batteryHealthPercent)
            : "",
        addOnProductIds: Array.isArray(metadata?.addOnProductIds)
          ? metadata.addOnProductIds.filter((id): id is string => typeof id === "string" && id !== product.id)
          : [],
        specifications: parseSpecificationsFromMetadata(product.metadata),
      })
    }
  }, [product, open])

  const showIphoneSeminovoFields = useMemo(() => {
    const cat = categories.find((c) => c.id === formData.categoryId)
    const br = brands.find((b) => b.id === formData.brandId)
    return (
      formData.condition === "seminovo" &&
      looksLikeIphoneProduct({
        title: formData.title,
        categoryName: cat?.name,
        categorySlug: cat?.slug,
        brandName: br?.name,
      })
    )
  }, [formData.title, formData.condition, formData.categoryId, formData.brandId, categories, brands])

  const showSpecsLookup = useMemo(() => {
    const cat = categories.find((c) => c.id === formData.categoryId)
    return isSmartphoneCategory(cat)
  }, [categories, formData.categoryId])

  const selectedBrandName = useMemo(() => {
    return brands.find((b) => b.id === formData.brandId)?.name
  }, [brands, formData.brandId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!product) return

    const base: Record<string, unknown> = {}
    try {
      if (product.metadata) Object.assign(base, JSON.parse(product.metadata))
    } catch {
      /* manter base vazio */
    }

    const sku = formData.sku?.trim()
    if (sku) base.sku = sku
    else delete base.sku

    const addOnProductIds = formData.addOnProductIds.filter((id) => id !== product.id)
    if (addOnProductIds.length > 0) base.addOnProductIds = addOnProductIds
    else delete base.addOnProductIds

    if (showIphoneSeminovoFields) {
      if (formData.semFaceId) base.semFaceId = true
      else delete base.semFaceId
      const pct = normalizeBatteryHealthPercent(formData.batteryHealthPercent)
      if (pct !== null) base.batteryHealthPercent = pct
      else delete base.batteryHealthPercent
    } else {
      delete base.semFaceId
      delete base.batteryHealthPercent
    }

    if (showSpecsLookup) {
      const specsField = specificationsToMetadataField(formData.specifications)
      if (specsField) base.specifications = specsField
      else delete base.specifications
    } else {
      delete base.specifications
    }

    const metadataJson = Object.keys(base).length > 0 ? JSON.stringify(base) : null

    try {
      const productType = product.type ? { code: product.type.code } : { code: "TICKET" }

      await updateProduct({
        variables: {
          id: product.id,
          input: {
            title: formData.title,
            summary: formData.summary || null,
            discount: formData.discount ? parseInt(formData.discount) : null,
            condition: formData.condition,
            type: productType,
            metadata: metadataJson,
            categoryId: formData.categoryId && formData.categoryId !== "none" ? formData.categoryId : null,
            brandId: formData.brandId && formData.brandId !== "none" ? formData.brandId : null,
          },
        },
      })
    } catch (err: unknown) {
      console.error("Error updating product:", err)
      showToast.error(
        "Erro ao atualizar produto",
        err instanceof Error ? err.message : "Ocorreu um erro ao atualizar o produto"
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-border/80">
          <DialogTitle className="text-lg font-semibold tracking-tight">Editar produto</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Atualize as informações visíveis na loja.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="mx-5 mt-4 bg-destructive/10 text-destructive px-3 py-2.5 rounded-md text-xs border border-destructive/20">
            <p className="font-medium">Erro ao atualizar produto</p>
            <p className="mt-0.5 opacity-90">{error.message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="px-5 py-4 space-y-3.5">
            <FormSection icon={Package} title="Produto" iconTone="bg-primary/10 text-primary">
              <Field label="Título" htmlFor="edit-title" required>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="Ex: iPhone 15 Pro Max 256GB"
                  disabled={loading}
                  className="h-9"
                />
              </Field>
            </FormSection>

            <FormSection icon={FileText} title="Descrição" iconTone="bg-sky-50 text-sky-800">
              <Field
                label="Descrição completa"
                hint="Use a barra de ferramentas para formatar o texto."
              >
                <RichTextEditor
                  value={formData.summary}
                  onChange={(value) => setFormData({ ...formData, summary: value })}
                  placeholder="Características, conteúdo da caixa, condição…"
                  disabled={loading}
                />
              </Field>
            </FormSection>

            <FormSection icon={Layers} title="Classificação" iconTone="bg-violet-50 text-violet-800">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Categoria" htmlFor="edit-categoryId">
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                    disabled={loading}
                  >
                    <SelectTrigger id="edit-categoryId" className="h-9 w-full">
                      <SelectValue placeholder="Selecione…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem categoria</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Marca" htmlFor="edit-brandId">
                  <Select
                    value={formData.brandId}
                    onValueChange={(value) => setFormData({ ...formData, brandId: value })}
                    disabled={loading}
                  >
                    <SelectTrigger id="edit-brandId" className="h-9 w-full">
                      <SelectValue placeholder="Selecione…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem marca</SelectItem>
                      {brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Estado" htmlFor="edit-condition">
                  <Select
                    value={formData.condition}
                    onValueChange={(value) => setFormData({ ...formData, condition: value })}
                    disabled={loading}
                  >
                    <SelectTrigger id="edit-condition" className="h-9 w-full">
                      <SelectValue placeholder="Selecione…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="novo">Novo</SelectItem>
                      <SelectItem value="seminovo">Seminovo</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="SKU" htmlFor="edit-sku">
                  <Input
                    id="edit-sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="Ex: IPH-15PM-256"
                    disabled={loading}
                    className="h-9"
                  />
                </Field>

                <Field label="Desconto (%)" htmlFor="edit-discount">
                  <Input
                    id="edit-discount"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                    placeholder="0"
                    disabled={loading}
                    className="h-9"
                  />
                </Field>
              </div>

              {showIphoneSeminovoFields && (
                <div className="rounded-md border border-border/70 bg-muted/20 p-3 space-y-2.5">
                  <div>
                    <p className="text-xs font-medium text-foreground">iPhone seminovo</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Campos informativos na ficha da loja. Opcional.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:items-end">
                    <div className="flex items-center gap-2 min-h-9">
                      <input
                        type="checkbox"
                        id="edit-semFaceId"
                        checked={formData.semFaceId}
                        onChange={(e) => setFormData({ ...formData, semFaceId: e.target.checked })}
                        disabled={loading}
                        className="h-4 w-4 rounded border-input accent-primary"
                      />
                      <Label htmlFor="edit-semFaceId" className="text-xs font-normal cursor-pointer">
                        Sem Face ID
                      </Label>
                    </div>
                    <Field label="Saúde da bateria (%)" htmlFor="edit-batteryHealthPercent">
                      <Input
                        id="edit-batteryHealthPercent"
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        value={formData.batteryHealthPercent}
                        onChange={(e) =>
                          setFormData({ ...formData, batteryHealthPercent: e.target.value })
                        }
                        placeholder="Ex: 87"
                        disabled={loading}
                        className="h-9"
                      />
                    </Field>
                  </div>
                </div>
              )}
            </FormSection>

            <ProductSpecsSection
              value={formData.specifications}
              onChange={(specifications) => setFormData({ ...formData, specifications })}
              titleQuery={formData.title}
              brandName={selectedBrandName}
              visible={showSpecsLookup}
              disabled={loading}
            />

            <FormSection icon={Puzzle} title="Produtos complementares" iconTone="bg-amber-50 text-amber-900">
              <Field
                label="Acessórios opcionais"
                hint="Aparecem na página do produto como compra adicional. Máximo 4."
              >
                <CuratedProductPicker
                  value={formData.addOnProductIds}
                  max={4}
                  orderLabel="Ordem dos acessórios"
                  description="Pesquisa e clica nas linhas para incluir ou remover."
                  onChange={(ids) =>
                    setFormData({
                      ...formData,
                      addOnProductIds: ids.filter((id) => id !== product?.id),
                    })
                  }
                />
              </Field>
            </FormSection>
          </div>

          <DialogFooter className="gap-2 px-5 py-3.5 border-t border-border/80 bg-muted/15 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" className="h-8 min-w-[108px]" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  A guardar…
                </>
              ) : (
                "Guardar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
