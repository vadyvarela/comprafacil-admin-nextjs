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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, ChevronDown, ChevronUp } from "lucide-react"
import { showToast } from "@/lib/utils/toast"
import { RichTextEditor } from "../ui/rich-text-editor"
import { looksLikeIphoneProduct, normalizeBatteryHealthPercent } from "@/lib/utils/iphone-seminovo-metadata"

interface EditProductModalProps {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditProductModal({
  product,
  open,
  onOpenChange,
}: EditProductModalProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    discount: "",
    condition: "novo",
    sku: "",
    categoryId: "",
    brandId: "",
    model: "",
    weight: "",
    dimensions: "",
    color: "",
    material: "",
    warranty: "",
    notes: "",
    semFaceId: false,
    batteryHealthPercent: "",
  })

  const { data: categoriesData } = useQuery(GET_CATEGORY_LIST, {
    skip: !open,
  })

  const { data: brandsData } = useQuery(GET_BRAND_LIST, {
    skip: !open,
  })

  type CategoryOption = { id: string; name: string; slug: string }
  type BrandOption = { id: string; name: string; slug: string }

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
        // Ignore parse errors
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
        model: typeof metadata?.model === "string" ? metadata.model : "",
        weight: typeof metadata?.weight === "string" ? metadata.weight : "",
        dimensions: typeof metadata?.dimensions === "string" ? metadata.dimensions : "",
        color: typeof metadata?.color === "string" ? metadata.color : "",
        material: typeof metadata?.material === "string" ? metadata.material : "",
        warranty: typeof metadata?.warranty === "string" ? metadata.warranty : "",
        notes: typeof metadata?.notes === "string" ? metadata.notes : "",
        semFaceId: metadata?.semFaceId === true,
        batteryHealthPercent:
          metadata?.batteryHealthPercent !== undefined && metadata?.batteryHealthPercent !== null
            ? String(metadata.batteryHealthPercent)
            : "",
      })
      
      setShowAdvanced(
        !!metadata &&
          (Object.keys(metadata).length > 0 ||
            metadata?.semFaceId === true ||
            (metadata?.batteryHealthPercent !== undefined && metadata?.batteryHealthPercent !== null && metadata?.batteryHealthPercent !== ""))
      )
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!product) return

    const base: Record<string, unknown> = {}
    try {
      if (product.metadata) Object.assign(base, JSON.parse(product.metadata))
    } catch {
      /* manter base vazio */
    }

    const setOrDel = (key: string, val: string | undefined) => {
      const t = val?.trim()
      if (t) base[key] = t
      else delete base[key]
    }
    setOrDel("sku", formData.sku)
    setOrDel("model", formData.model)
    setOrDel("weight", formData.weight)
    setOrDel("dimensions", formData.dimensions)
    setOrDel("color", formData.color)
    setOrDel("material", formData.material)
    setOrDel("warranty", formData.warranty)
    setOrDel("notes", formData.notes)

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

    const metadataJson = Object.keys(base).length > 0 ? JSON.stringify(base) : null

    try {
      // Sempre usar GraphQL para atualizar o produto (sem imagem)
      // Remover __typename do type se existir (adicionado pelo Apollo Client)
      const productType = product.type 
        ? { code: product.type.code } 
        : { code: "TICKET" }
      
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

      showToast.success("Produto atualizado", "As alterações foram salvas com sucesso")
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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-2xl font-semibold">Editar produto</DialogTitle>
          <DialogDescription className="text-base mt-2">
            Atualize as informações do produto. Campos adicionais são salvos em
            metadata.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm border border-destructive/20">
            <p className="font-medium">Erro ao atualizar produto</p>
            <p className="mt-1 text-xs">{error.message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Título <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
                placeholder="Nome do produto"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">Descrição Completa</Label>
              <RichTextEditor
                value={formData.summary}
                onChange={(value) =>
                  setFormData({ ...formData, summary: value })
                }
                placeholder="Digite a descrição completa do produto com formatação..."
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Use a barra de ferramentas para formatar o texto
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) =>
                    setFormData({ ...formData, sku: e.target.value })
                  }
                  placeholder="Código SKU"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount">Desconto (%)</Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discount}
                  onChange={(e) =>
                    setFormData({ ...formData, discount: e.target.value })
                  }
                  placeholder="Ex: 10"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="categoryId">Categoria</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, categoryId: value })
                  }
                  disabled={loading}
                >
                  <SelectTrigger id="categoryId">
                    <SelectValue placeholder="Selecione..." />
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="brandId">Marca</Label>
                <Select
                  value={formData.brandId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, brandId: value })
                  }
                  disabled={loading}
                >
                  <SelectTrigger id="brandId">
                    <SelectValue placeholder="Selecione..." />
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
                <p className="text-xs text-muted-foreground">
                  Selecione a marca para atualizar ou manter a atual.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition">Estado</Label>
                <Select
                  value={formData.condition}
                  onValueChange={(value) =>
                    setFormData({ ...formData, condition: value })
                  }
                  disabled={loading}
                >
                  <SelectTrigger id="condition">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="novo">Novo</SelectItem>
                    <SelectItem value="seminovo">Seminovo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Informações Adicionais (Metadata) */}
          <div className="space-y-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full justify-between"
            >
              <span className="text-sm font-medium">Informações Adicionais</span>
              {showAdvanced ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>

            {showAdvanced && (
              <div className="space-y-4 pt-2 border-t">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="model">Modelo</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={(e) =>
                        setFormData({ ...formData, model: e.target.value })
                      }
                      placeholder="Ex: A2847"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight">Peso</Label>
                    <Input
                      id="weight"
                      value={formData.weight}
                      onChange={(e) =>
                        setFormData({ ...formData, weight: e.target.value })
                      }
                      placeholder="Ex: 221g"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dimensions">Dimensões</Label>
                    <Input
                      id="dimensions"
                      value={formData.dimensions}
                      onChange={(e) =>
                        setFormData({ ...formData, dimensions: e.target.value })
                      }
                      placeholder="Ex: 159.9 x 76.7 x 8.25 mm"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="color">Cor</Label>
                    <Input
                      id="color"
                      value={formData.color}
                      onChange={(e) =>
                        setFormData({ ...formData, color: e.target.value })
                      }
                      placeholder="Ex: Natural Titanium"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="material">Material</Label>
                    <Input
                      id="material"
                      value={formData.material}
                      onChange={(e) =>
                        setFormData({ ...formData, material: e.target.value })
                      }
                      placeholder="Ex: Titanium"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="warranty">Garantia</Label>
                  <Input
                    id="warranty"
                    value={formData.warranty}
                    onChange={(e) =>
                      setFormData({ ...formData, warranty: e.target.value })
                    }
                    placeholder="Ex: 1 ano"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Notas adicionais sobre o produto..."
                    disabled={loading}
                    className="min-h-[80px] resize-none"
                  />
                </div>

                {showIphoneSeminovoFields && (
                  <div className="rounded-md border border-border/80 bg-muted/20 p-3 space-y-3">
                    <p className="text-xs font-medium text-foreground">iPhone seminovo (informativo)</p>
                    <p className="text-[11px] text-muted-foreground">
                      Visível na loja só em iPhone em estado seminovo. Não afeta preço nem stock.
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="semFaceId"
                        checked={formData.semFaceId}
                        onChange={(e) =>
                          setFormData({ ...formData, semFaceId: e.target.checked })
                        }
                        disabled={loading}
                        className="h-4 w-4 rounded border-input accent-primary"
                      />
                      <Label htmlFor="semFaceId" className="text-sm font-normal cursor-pointer">
                        Sem Face ID
                      </Label>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="batteryHealthPercent">Saúde da bateria (%)</Label>
                      <Input
                        id="batteryHealthPercent"
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
                        className="max-w-[120px]"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
