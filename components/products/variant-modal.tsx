"use client"

import { useState, useEffect } from "react"
import { useMutation, useQuery } from "@apollo/client/react"
import {
  CREATE_PRODUCT_VARIANT,
  UPDATE_PRODUCT_VARIANT,
} from "@/lib/graphql/variants/mutations"
import { GET_PRODUCT } from "@/lib/graphql/products/queries"
import { ProductVariant } from "@/lib/graphql/products/types"
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
import { Separator } from "@/components/ui/separator"
import { showToast } from "@/lib/utils/toast"
import { Plus, Trash2 } from "lucide-react"

interface VariantModalProps {
  productId: string
  variant: ProductVariant | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VariantModal({
  productId,
  variant,
  open,
  onOpenChange,
}: VariantModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    quantity: 0,
    sku: "",
    // Campos de preço
    priceNickname: "",
    priceUnitAmount: "",
    priceCurrency: "CVE",
    // Atributos (ex: Cor, Capacidade, etc.)
    attributes: [] as Array<{ key: string; value: string }>,
  })

  const CURRENCIES = [
    { code: "CVE", name: "Escudo Cabo-verdiano" },
    { code: "EUR", name: "Euro" },
    { code: "USD", name: "Dólar Americano" },
  ]

  const isEditMode = !!variant

  const [createVariant, { loading: creating }] = useMutation(
    CREATE_PRODUCT_VARIANT,
    {
      refetchQueries: [{ query: GET_PRODUCT, variables: { id: productId } }],
      onCompleted: () => {
        showToast.success("Variante criada", "A variante foi criada com sucesso")
        onOpenChange(false)
        resetForm()
      },
    }
  )

  const [updateVariant, { loading: updating }] = useMutation(
    UPDATE_PRODUCT_VARIANT,
    {
      refetchQueries: [{ query: GET_PRODUCT, variables: { id: productId } }],
      onCompleted: () => {
        showToast.success("Variante atualizada", "As alterações foram salvas com sucesso")
        onOpenChange(false)
        resetForm()
      },
    }
  )

  const loading = creating || updating

  // Buscar informações do produto para verificar estoque disponível
  const { data: productData } = useQuery(GET_PRODUCT, {
    variables: { id: productId },
    skip: !productId || !open,
  })

  const product = productData?.productDetails
  const availableStock = product?.stock?.quantity ?? 0

  useEffect(() => {
    if (variant) {
      let metadata = null
      try {
        metadata = variant.metadata ? JSON.parse(variant.metadata) : null
      } catch (e) {
        // Ignore parse errors
      }

      // Extrair atributos do metadata
      const attributes = metadata?.attributes
        ? Object.entries(metadata.attributes).map(([key, value]) => ({
            key,
            value: String(value),
          }))
        : []

      setFormData({
        title: variant.title || "",
        quantity: variant.quantity || 0,
        sku: metadata?.sku || "",
        priceNickname: variant.price?.nickname || "",
        priceUnitAmount: variant.price?.unitAmount
          ? (variant.price.unitAmount / 100).toString()
          : "",
        priceCurrency: variant.price?.currency || "CVE",
        attributes,
      })
    } else {
      resetForm()
    }
  }, [variant, open])

  const resetForm = () => {
    setFormData({
      title: "",
      quantity: 0,
      sku: "",
      priceNickname: "",
      priceUnitAmount: "",
      priceCurrency: "CVE",
      attributes: [],
    })
  }

  const addAttribute = () => {
    setFormData({
      ...formData,
      attributes: [...formData.attributes, { key: "", value: "" }],
    })
  }

  const removeAttribute = (index: number) => {
    setFormData({
      ...formData,
      attributes: formData.attributes.filter((_, i) => i !== index),
    })
  }

  const updateAttribute = (
    index: number,
    field: "key" | "value",
    value: string
  ) => {
    const newAttributes = [...formData.attributes]
    newAttributes[index] = { ...newAttributes[index], [field]: value }
    setFormData({ ...formData, attributes: newAttributes })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validação: ao criar nova variante, verificar se há estoque suficiente
    if (!isEditMode && formData.quantity > availableStock) {
      showToast.error(
        "Estoque insuficiente",
        `Quantidade solicitada (${formData.quantity}) excede o estoque disponível (${availableStock}). Por favor, atualize o estoque do produto primeiro ou crie a variante com quantidade 0.`
      )
      return
    }

    // Construir metadata com atributos
    const attributesObject: Record<string, string> = {}
    formData.attributes.forEach((attr) => {
      if (attr.key && attr.value) {
        attributesObject[attr.key] = attr.value
      }
    })

    const metadata: Record<string, any> = {}
    if (formData.sku) {
      metadata.sku = formData.sku
    }
    if (Object.keys(attributesObject).length > 0) {
      metadata.attributes = attributesObject
    }

    // Preparar dados de preço se fornecidos
    const priceData =
      formData.priceNickname && formData.priceUnitAmount
        ? {
            nickname: formData.priceNickname,
            unitAmount: Math.round(parseFloat(formData.priceUnitAmount) * 100),
            currency: formData.priceCurrency,
          }
        : null

    if (isEditMode && variant) {
      // Ao editar, não podemos incluir priceData (schema não permite)
      // O preço deve ser atualizado separadamente via PriceModal
      await updateVariant({
        variables: {
          id: variant.id,
          input: {
            title: formData.title,
            quantity: formData.quantity,
            metadata: JSON.stringify(metadata),
            productId, // Necessário no update também
          },
        },
      })
    } else {
      // Ao criar, podemos incluir priceData se fornecido
      await createVariant({
        variables: {
          input: {
            productId,
            title: formData.title,
            quantity: formData.quantity,
            metadata: JSON.stringify(metadata),
            // Se houver preço, incluir priceData
            ...(priceData && { priceData }),
          },
        },
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Editar Variante" : "Criar Variante"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Atualize as informações da variante."
              : "Adicione uma nova variante para este produto."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
                placeholder="Ex: 256GB, Vermelho, Tamanho M"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantidade *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  max={!isEditMode ? availableStock : undefined}
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quantity: parseInt(e.target.value) || 0,
                    })
                  }
                  required
                  placeholder="0"
                />
                {!isEditMode && (
                  <p className="text-xs text-muted-foreground">
                    Disponível: <strong>{availableStock}</strong>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) =>
                    setFormData({ ...formData, sku: e.target.value })
                  }
                  placeholder="Código SKU"
                />
              </div>
            </div>

            <Separator />

            {/* Seção de Atributos */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Atributos</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Adicione atributos como Cor, Capacidade, Tamanho, etc.
                    (ex: Cor: Preta, Capacidade: 128GB)
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addAttribute}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </div>

              {formData.attributes.length > 0 && (
                <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
                  {formData.attributes.map((attr, index) => (
                    <div
                      key={index}
                      className="flex gap-2 items-end"
                    >
                      <div className="flex-1 space-y-2">
                        <Label htmlFor={`attr-key-${index}`} className="text-xs">
                          Nome do Atributo
                        </Label>
                        <Input
                          id={`attr-key-${index}`}
                          value={attr.key}
                          onChange={(e) =>
                            updateAttribute(index, "key", e.target.value)
                          }
                          placeholder="Ex: Cor, Capacidade, Tamanho"
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <Label htmlFor={`attr-value-${index}`} className="text-xs">
                          Valor
                        </Label>
                        <Input
                          id={`attr-value-${index}`}
                          value={attr.value}
                          onChange={(e) =>
                            updateAttribute(index, "value", e.target.value)
                          }
                          placeholder="Ex: Preta, 128GB, M"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAttribute(index)}
                        className="shrink-0"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!isEditMode && formData.quantity > availableStock && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
                A quantidade solicitada excede o estoque disponível. Atualize o
                estoque do produto primeiro ou crie a variante com quantidade 0.
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Preço</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Opcional - pode ser adicionado depois
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="priceNickname">Nome do Preço</Label>
                <Input
                  id="priceNickname"
                  value={formData.priceNickname}
                  onChange={(e) =>
                    setFormData({ ...formData, priceNickname: e.target.value })
                  }
                  placeholder="Ex: Preço padrão"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priceCurrency">Moeda</Label>
                <Select
                  value={formData.priceCurrency}
                  onValueChange={(value) =>
                    setFormData({ ...formData, priceCurrency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priceUnitAmount">Valor</Label>
              <Input
                id="priceUnitAmount"
                type="number"
                step="0.01"
                min="0"
                value={formData.priceUnitAmount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    priceUnitAmount: e.target.value,
                  })
                }
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground">
                Valor em unidades (ex: 100.00 = 100 unidades)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false)
                resetForm()
              }}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? isEditMode
                  ? "Salvando..."
                  : "Criando..."
                : isEditMode
                ? "Salvar Alterações"
                : "Criar Variante"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

