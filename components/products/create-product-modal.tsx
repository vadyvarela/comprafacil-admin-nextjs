"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useMutation, useQuery } from "@apollo/client/react"
import { useRouter } from "next/navigation"
import { CREATE_PRODUCT } from "@/lib/graphql/products/mutations"
import { GET_PRODUCTS } from "@/lib/graphql/products/queries"
import { GET_CATEGORY_LIST } from "@/lib/graphql/categories/queries"
import { GET_BRAND_LIST } from "@/lib/graphql/brands/queries"
import { CREATE_PRODUCT_VARIANT } from "@/lib/graphql/variants/mutations"
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
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChevronDown, Loader2, Package, FileText, Layers, Tag } from "lucide-react"
import { showToast } from "@/lib/utils/toast"
import { recordAuditLog } from "@/lib/actions/auditLogs"
import { Field, FormSection } from "@/components/products/product-form-layout"
import { ProductSpecsSection } from "@/components/products/product-specs-lookup"
import { specificationsToMetadataField } from "@/lib/product-specs/map-mobileapi-to-specifications"
import type { ProductSpecifications } from "@/lib/product-specs/types"
import {
  formatCategoryLabel,
  sortCategoriesForSelect,
} from "@/lib/categories/format-category-label"

interface CreateProductModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateProductModal({
  open,
  onOpenChange,
}: CreateProductModalProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    categoryId: "none",
    brandId: "none",
    condition: "novo",
    status: "INACTIVE",
    price: "",
    quantity: "",
    createDefaultVariant: true,
    specifications: {} as ProductSpecifications,
  })
  const [descriptionOpen, setDescriptionOpen] = useState(false)

  const { data: categoriesData, loading: categoriesLoading } = useQuery<{
    categoryList: {
      id: string
      name: string
      slug: string
      parentCategory?: { id: string; name: string } | null
    }[]
  }>(GET_CATEGORY_LIST, {
    skip: !open,
  })

  const { data: brandsData, loading: brandsLoading } = useQuery<{
    brandList: { id: string; name: string; slug: string }[]
  }>(GET_BRAND_LIST, {
    skip: !open,
  })

  const categories = useMemo(
    () => sortCategoriesForSelect(categoriesData?.categoryList ?? []),
    [categoriesData],
  )
  const brands = useMemo(() => brandsData?.brandList ?? [], [brandsData])

  const resetForm = useCallback(() => {
    setFormData({
      title: "",
      summary: "",
      categoryId: "none",
      brandId: "none",
      condition: "novo",
      status: "INACTIVE",
      price: "",
      quantity: "",
      createDefaultVariant: true,
      specifications: {},
    })
    setDescriptionOpen(false)
  }, [])

  const [createProduct, { loading, error }] = useMutation<{
    createProduct: { id: string }
  }>(CREATE_PRODUCT, {
    refetchQueries: [{ query: GET_PRODUCTS }],
  })

  const [createVariant] = useMutation(CREATE_PRODUCT_VARIANT)

  useEffect(() => {
    if (!open) {
      resetForm()
    }
  }, [open, resetForm])

  const selectedBrandName = useMemo(() => {
    return brands.find((b) => b.id === formData.brandId)?.name
  }, [brands, formData.brandId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      return
    }

    const priceAmount = Number.parseFloat(formData.price)
    if (formData.createDefaultVariant && (!Number.isFinite(priceAmount) || priceAmount <= 0)) {
      showToast.error("Preço obrigatório", "Indica um preço maior que zero para criar a variante.")
      return
    }

    const quantity = Number.parseInt(formData.quantity, 10) || 0
    const metadata: Record<string, unknown> = {}

    const specsField = specificationsToMetadataField(formData.specifications)
    if (specsField) metadata.specifications = specsField

    const categoryId =
      formData.categoryId && formData.categoryId !== "none"
        ? formData.categoryId
        : null

    const brandId =
      formData.brandId && formData.brandId !== "none"
        ? formData.brandId
        : null

    try {
      const { data: productData } = await createProduct({
        variables: {
          input: {
            title: formData.title.trim(),
            summary: formData.summary?.trim() || null,
            type: {
              code: "TICKET",
            },
            status: {
              code: formData.status,
            },
            metadata: Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : null,
            condition: formData.condition,
            categoryId,
            brandId,
            stockData: {
              name: `Stock - ${formData.title.trim()}`,
              quantity: 0,
            },
          },
        },
      })

      const productId = productData?.createProduct?.id

      if (!productId) {
        throw new Error("Erro ao criar produto: ID não retornado")
      }

      void recordAuditLog({
        action: "PRODUCT_CREATED",
        entityType: "PRODUCT",
        entityId: productId,
        metadata: { title: formData.title.trim() },
      })

      if (formData.createDefaultVariant) {
        await createVariant({
          variables: {
            input: {
              productId,
              title: formData.title.trim(),
              quantity,
              metadata: null,
              priceData: {
                nickname: "Preço padrão",
                unitAmount: Math.round(priceAmount * 100),
                currency: "CVE",
              },
            },
          },
        })
      }

      showToast.success("Produto criado", `O produto "${formData.title.trim()}" foi criado com sucesso`)
      onOpenChange(false)
      resetForm()
      router.push(`/dashboard/products/${productId}`)
    } catch (err: unknown) {
      console.error("Error creating product:", err)
      showToast.error(
        "Erro ao criar produto",
        err instanceof Error ? err.message : "Ocorreu um erro ao criar o produto"
      )
    }
  }

  const isLoading = loading || categoriesLoading || brandsLoading

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-border/80">
          <DialogTitle className="text-lg font-semibold">Novo produto</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Informações essenciais para publicar o produto na loja.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="mx-5 mt-4 bg-destructive/10 text-destructive px-3 py-2.5 rounded-md text-xs border border-destructive/20">
            <p className="font-medium">Erro ao criar produto</p>
            <p className="mt-0.5 opacity-90">{error.message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="px-5 py-4 space-y-3.5">
            <FormSection icon={Package} title="Produto" iconTone="bg-primary/10 text-primary">
              <Field label="Título" htmlFor="title" required>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="Ex: iPhone 15 Pro Max 256GB"
                  disabled={isLoading}
                  className="h-9"
                />
              </Field>
            </FormSection>

            <FormSection icon={Layers} title="Classificação" iconTone="bg-violet-50 text-violet-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Categoria" htmlFor="categoryId">
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="categoryId" className="h-9 w-full">
                      <SelectValue placeholder="Selecione…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem categoria</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {formatCategoryLabel(category)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Marca" htmlFor="brandId">
                  <Select
                    value={formData.brandId}
                    onValueChange={(value) => setFormData({ ...formData, brandId: value })}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="brandId" className="h-9 w-full">
                      <SelectValue placeholder="Selecione…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem marca</SelectItem>
                      {brands.map((brand: { id: string; name: string }) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Condição" htmlFor="condition">
                  <Select
                    value={formData.condition}
                    onValueChange={(value) => setFormData({ ...formData, condition: value })}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="condition" className="h-9 w-full">
                      <SelectValue placeholder="Selecione…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="novo">Novo</SelectItem>
                      <SelectItem value="seminovo">Seminovo</SelectItem>
                      <SelectItem value="usado">Usado</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Field
                  label="Visibilidade"
                  htmlFor="status"
                  hint="Rascunho fica oculto na loja."
                >
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="status" className="h-9 w-full">
                      <SelectValue placeholder="Selecione…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Publicado</SelectItem>
                      <SelectItem value="INACTIVE">Rascunho</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </FormSection>

            <FormSection icon={Tag} title="Preço e stock" iconTone="bg-emerald-50 text-emerald-800">
              <label
                htmlFor="createDefaultVariant"
                className="flex items-start gap-2.5 rounded-md border border-border/70 bg-muted/15 px-3 py-2.5 cursor-pointer hover:bg-muted/25 transition-colors"
              >
                <input
                  type="checkbox"
                  id="createDefaultVariant"
                  checked={formData.createDefaultVariant}
                  onChange={(e) =>
                    setFormData({ ...formData, createDefaultVariant: e.target.checked })
                  }
                  className="mt-0.5 h-4 w-4 rounded border-input accent-primary"
                  disabled={isLoading}
                />
                <span className="space-y-0.5">
                  <span className="block text-xs font-medium text-foreground">
                    Activar variante com preço
                  </span>
                  <span className="block text-[11px] text-muted-foreground leading-snug">
                    Cria uma variante inicial para definir preço e quantidade.
                  </span>
                </span>
              </label>

              {formData.createDefaultVariant ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Preço (CVE)" htmlFor="price" required>
                    <Input
                      id="price"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="1000.00"
                      required={formData.createDefaultVariant}
                      disabled={isLoading}
                      className="h-9"
                    />
                  </Field>
                  <Field label="Quantidade em stock" htmlFor="quantity">
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      placeholder="10"
                      disabled={isLoading}
                      className="h-9"
                    />
                  </Field>
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground rounded-md border border-dashed border-border/70 bg-muted/10 px-3 py-2 leading-relaxed">
                  O produto será criado sem variante. Pode adicionar opções e variantes depois na página de detalhes.
                </p>
              )}
            </FormSection>

            <ProductSpecsSection
              value={formData.specifications}
              onChange={(specifications) => setFormData({ ...formData, specifications })}
              titleQuery={formData.title}
              brandName={selectedBrandName}
              disabled={isLoading}
            />

            <Collapsible
              open={descriptionOpen}
              onOpenChange={setDescriptionOpen}
              className="rounded-lg border border-border/80 bg-card shadow-xs overflow-hidden"
            >
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-auto w-full justify-between gap-3 rounded-none px-3.5 py-2 text-left hover:bg-muted/25"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border/60 bg-sky-50 text-sky-800">
                      <FileText className="h-3 w-3" />
                    </span>
                    <span className="text-xs font-medium">Descrição</span>
                  </span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${
                      descriptionOpen ? "rotate-180" : ""
                    }`}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="border-t border-border/80 p-3.5">
                <Field label="Descrição completa">
                  <RichTextEditor
                    value={formData.summary}
                    onChange={(value) => setFormData({ ...formData, summary: value })}
                    placeholder="Características, conteúdo da caixa, condição..."
                    disabled={isLoading}
                  />
                </Field>
              </CollapsibleContent>
            </Collapsible>
          </div>

          <DialogFooter className="gap-2 px-5 py-3.5 border-t border-border/80 bg-muted/15 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              className="h-8 min-w-[108px]"
              disabled={
                isLoading ||
                !formData.title.trim() ||
                (formData.createDefaultVariant && !formData.price.trim())
              }
            >
              {loading ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  A criar…
                </>
              ) : (
                "Criar produto"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
