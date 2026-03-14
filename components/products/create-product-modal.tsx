"use client"

import { useState, useEffect } from "react"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, ChevronDown, ChevronUp } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { showToast } from "@/lib/utils/toast"

interface CreateProductModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateProductModal({
  open,
  onOpenChange,
}: CreateProductModalProps) {
  const router = useRouter()
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    summary: "",
    sku: "",
    categoryId: "none",
    brandId: "none",
    discount: "",
    price: "",
    quantity: "",
    createDefaultVariant: true, // Por padrão, criar variante padrão
    brand: "",
    // Metadata expandido
    model: "",
    weight: "",
    dimensions: "",
    color: "",
    material: "",
    warranty: "",
    notes: "",
  })

  const { data: categoriesData, loading: categoriesLoading } = useQuery<{
    categoryList: { id: string; name: string; slug: string }[]
  }>(GET_CATEGORY_LIST, {
    skip: !open,
  })

  const { data: brandsData, loading: brandsLoading } = useQuery<{
    brandList: { id: string; name: string; slug: string }[]
  }>(GET_BRAND_LIST, {
    skip: !open,
  })

  const categories = categoriesData?.categoryList || []
  const brands = brandsData?.brandList || []

  const [createProduct, { loading, error }] = useMutation<{
    createProduct: { id: string }
  }>(CREATE_PRODUCT, {
    refetchQueries: [{ query: GET_PRODUCTS }],
  })

  const [createVariant] = useMutation(CREATE_PRODUCT_VARIANT)

  useEffect(() => {
    if (!open) {
      resetForm()
      setShowAdvanced(false)
    }
  }, [open])

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      summary: "",
      sku: "",
      categoryId: "none",
      brandId: "none",
      discount: "",
      price: "",
      quantity: "",
      createDefaultVariant: true,
      brand: "",
      model: "",
      weight: "",
      dimensions: "",
      color: "",
      material: "",
      warranty: "",
      notes: "",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      return
    }

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

    const categoryId =
      formData.categoryId && formData.categoryId !== "none"
        ? formData.categoryId
        : null

    const brandId =
      formData.brandId && formData.brandId !== "none"
        ? formData.brandId
        : null

    const discount = formData.discount ? parseInt(formData.discount) : null

    try {
      const { data: productData } = await createProduct({
        variables: {
          input: {
            title: formData.title.trim(),
            description: formData.description?.trim() || null,
            summary: formData.summary?.trim() || null,
            discount,
            type: {
              code: "TICKET",
            },
            metadata: Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : null,
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

      // Se preço foi fornecido e createDefaultVariant está ativo, criar variante padrão
      if (formData.createDefaultVariant && formData.price) {
        const priceAmount = parseFloat(formData.price)
        const quantity = parseInt(formData.quantity) || 0

        if (priceAmount > 0) {
          // Criar variante padrão
          const variantMetadata: Record<string, any> = {}
          if (formData.sku) {
            variantMetadata.sku = formData.sku.trim()
          }

          await createVariant({
            variables: {
              input: {
                productId,
                title: formData.title.trim(), // Usar título do produto como título da variante padrão
                quantity,
                metadata: JSON.stringify(variantMetadata),
                priceData: {
                  nickname: "Preço padrão",
                  unitAmount: Math.round(priceAmount * 100), // Converter para centavos
                  currency: "CVE",
                },
              },
            },
          })
        }
      }

      showToast.success("Produto criado", `O produto "${formData.title.trim()}" foi criado com sucesso`)
      onOpenChange(false)
      resetForm()
      router.push(`/dashboard/products/${productId}`)
    } catch (err: any) {
      console.error("Error creating product:", err)
      showToast.error("Erro ao criar produto", err.message || "Ocorreu um erro ao criar o produto")
    }
  }

  const isLoading = loading || categoriesLoading || brandsLoading

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-2xl font-semibold">Novo produto</DialogTitle>
          <DialogDescription className="text-base mt-2">
            Preencha as informações básicas do produto. Campos adicionais podem ser
            salvos em metadata.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm border border-destructive/20">
            <p className="font-medium">Erro ao criar produto</p>
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
                placeholder="Ex: iPhone 15 Pro Max"
                disabled={isLoading}
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
                placeholder="Descreva o produto..."
                disabled={isLoading}
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
                disabled={isLoading}
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
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoryId">Categoria</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, categoryId: value })
                  }
                  disabled={isLoading}
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
                  disabled={isLoading}
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
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Seção de Variante Padrão */}
            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="createDefaultVariant"
                  checked={formData.createDefaultVariant}
                  onChange={(e) =>
                    setFormData({ ...formData, createDefaultVariant: e.target.checked })
                  }
                  className="h-4 w-4"
                  disabled={isLoading}
                />
                <Label htmlFor="createDefaultVariant" className="text-sm font-medium cursor-pointer">
                  Criar variante padrão com preço
                </Label>
              </div>

              {formData.createDefaultVariant && (
                <div className="grid grid-cols-2 gap-4 pl-6">
                  <div className="space-y-2">
                    <Label htmlFor="price">
                      Preço (CVE) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      placeholder="Ex: 1000.00"
                      required={formData.createDefaultVariant}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantidade em Estoque</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      value={formData.quantity}
                      onChange={(e) =>
                        setFormData({ ...formData, quantity: e.target.value })
                      }
                      placeholder="Ex: 10"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              )}

              {!formData.createDefaultVariant && (
                <p className="text-xs text-gray-500 pl-6">
                  O produto será criado sem variantes. Você pode adicionar variantes depois na página de detalhes do produto.
                </p>
              )}
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
                      disabled={isLoading}
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
                      disabled={isLoading}
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
                      disabled={isLoading}
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
                      disabled={isLoading}
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
                      disabled={isLoading}
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
                    disabled={isLoading}
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
                    disabled={isLoading}
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
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !formData.title.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Produto"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
