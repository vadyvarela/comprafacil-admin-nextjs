"use client"

import { useState, useEffect } from "react"
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
    description: "",
    summary: "",
    discount: "",
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
  })

  const { data: categoriesData } = useQuery(GET_CATEGORY_LIST, {
    skip: !open,
  })

  const { data: brandsData } = useQuery(GET_BRAND_LIST, {
    skip: !open,
  })

  const categories = (categoriesData as { categoryList?: unknown[] } | undefined)?.categoryList || []
  const brands = (brandsData as { brandList?: unknown[] } | undefined)?.brandList || []

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
      let metadata = null
      try {
        metadata = product.metadata ? JSON.parse(product.metadata) : null
      } catch (e) {
        // Ignore parse errors
      }

      setFormData({
        title: product.title || "",
        description: product.description || "",
        summary: product.summary || "",
        discount: product.discount?.toString() || "",
        sku: metadata?.sku || "",
        categoryId: product.category?.id || "none",
        brandId: "none", // productDetails API não retorna brand — usuário reseleciona ao editar
        model: metadata?.model || "",
        weight: metadata?.weight || "",
        dimensions: metadata?.dimensions || "",
        color: metadata?.color || "",
        material: metadata?.material || "",
        warranty: metadata?.warranty || "",
        notes: metadata?.notes || "",
      })
      
      // Mostrar seção avançada se houver metadata
      setShowAdvanced(!!metadata && Object.keys(metadata).length > 0)
    }
  }, [product, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!product) return

    // Construir metadata com todos os campos preenchidos
    const metadata: Record<string, any> = {}
    
    if (formData.sku?.trim()) metadata.sku = formData.sku.trim()
    if (formData.model?.trim()) metadata.model = formData.model.trim()
    if (formData.weight?.trim()) metadata.weight = formData.weight.trim()
    if (formData.dimensions?.trim()) metadata.dimensions = formData.dimensions.trim()
    if (formData.color?.trim()) metadata.color = formData.color.trim()
    if (formData.material?.trim()) metadata.material = formData.material.trim()
    if (formData.warranty?.trim()) metadata.warranty = formData.warranty.trim()
    if (formData.notes?.trim()) metadata.notes = formData.notes.trim()

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
            description: formData.description || null,
            summary: formData.summary || null,
            discount: formData.discount ? parseInt(formData.discount) : null,
            type: productType,
            metadata: Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : null,
            categoryId: formData.categoryId && formData.categoryId !== "none" ? formData.categoryId : null,
            brandId: formData.brandId && formData.brandId !== "none" ? formData.brandId : null,
          },
        },
      })

      showToast.success("Produto atualizado", "As alterações foram salvas com sucesso")
    } catch (err: any) {
      console.error("Error updating product:", err)
      showToast.error("Erro ao atualizar produto", err.message || "Ocorreu um erro ao atualizar o produto")
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
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Descrição do produto"
                disabled={loading}
                className="min-h-[100px] resize-none"
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

            <div className="grid grid-cols-2 gap-4">
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
                    {categories.map((category: any) => (
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
                    {brands.map((brand: any) => (
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
