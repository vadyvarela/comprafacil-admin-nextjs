"use client"

import { useState, useEffect, useMemo } from "react"
import { useMutation, useQuery } from "@apollo/client/react"
import {
  CREATE_PRODUCT_VARIANT,
  UPDATE_PRODUCT_VARIANT,
  DELETE_PRODUCT_VARIANT,
} from "@/lib/graphql/variants/mutations"
import { CREATE_PRICE, UPDATE_PRICE } from "@/lib/graphql/prices/mutations"
import { GET_PRODUCT } from "@/lib/graphql/products/queries"
import type { Product, ProductVariant } from "@/lib/graphql/products/types"
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
import { Plus, Trash2, Pencil, X, Check, Warehouse, X as XIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { VariantImageUpload } from "./variant-image-upload"

interface VariantManagerProps {
  productId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ProductOption {
  id: string
  title: string // Ex: "Cor", "Capacidade"
  values: string[] // Ex: ["Azul", "Verde"], ["128GB", "256GB"]
}

interface ProductVariantCombination {
  id?: string // ID da variante existente (se já foi criada)
  optionValues: Record<string, string> // { "Cor": "Azul", "Capacidade": "128GB" }
  price: string
  stock: number
  image?: string
  sku?: string
}

const CURRENCIES = [
  { code: "CVE", name: "Escudo Cabo-verdiano" },
  { code: "EUR", name: "Euro" },
  { code: "USD", name: "Dólar Americano" },
]

export function VariantManager({
  productId,
  open,
  onOpenChange,
}: VariantManagerProps) {
  const { data, loading } = useQuery<{ productDetails?: Product }>(GET_PRODUCT, {
    variables: { id: productId },
    skip: !productId || !open,
  })

  const product = data?.productDetails
  const existingVariants = product?.variants || []

  const [options, setOptions] = useState<ProductOption[]>([])
  const [variantCombinations, setVariantCombinations] = useState<ProductVariantCombination[]>([])
  const [activeVariants, setActiveVariants] = useState(true)

  // Carregar opções e variantes existentes
  useEffect(() => {
    if (existingVariants.length > 0) {
      // Extrair opções das variantes existentes
      const extractedOptions: Record<string, Set<string>> = {}
      
      existingVariants.forEach((variant) => {
        if (variant.metadata) {
          try {
            const metadata = JSON.parse(variant.metadata)
            const attributes = metadata.attributes || {}
            
            Object.entries(attributes).forEach(([key, value]) => {
              if (!extractedOptions[key]) {
                extractedOptions[key] = new Set()
              }
              extractedOptions[key].add(String(value))
            })
          } catch {}
        }
      })

      const optionsArray: ProductOption[] = Object.entries(extractedOptions).map(
        ([title, valuesSet], index) => ({
          id: `option-${index}`,
          title,
          values: Array.from(valuesSet),
        })
      )

      if (optionsArray.length > 0) {
        setOptions(optionsArray)
      }

      // Mapear variantes existentes para combinações
      const combinations: ProductVariantCombination[] = existingVariants.map((variant) => {
        const metadata = variant.metadata
          ? (() => {
              try {
                return JSON.parse(variant.metadata)
              } catch {
                return {}
              }
            })()
          : {}

        const optionValues: Record<string, string> = metadata.attributes || {}
        
        return {
          id: variant.id,
          optionValues,
          price: variant.price ? (variant.price.unitAmount / 100).toFixed(2) : "",
          stock: variant.quantity || 0,
          image: metadata.image || undefined,
          sku: metadata.sku || undefined,
        }
      })

      setVariantCombinations(combinations)
    }
  }, [existingVariants])

  // Gerar todas as combinações possíveis das opções
  const generatedCombinations = useMemo(() => {
    if (options.length === 0) return []

    const generate = (opts: ProductOption[], index = 0, current: Record<string, string> = {}): Record<string, string>[] => {
      if (index >= opts.length) {
        return [current]
      }

      const results: Record<string, string>[] = []
      const option = opts[index]

      option.values.forEach((value) => {
        const newCurrent = { ...current, [option.title]: value }
        results.push(...generate(opts, index + 1, newCurrent))
      })

      return results
    }

    return generate(options)
  }, [options])

  const [createVariant] = useMutation(CREATE_PRODUCT_VARIANT, {
    refetchQueries: [{ query: GET_PRODUCT, variables: { id: productId } }],
    onCompleted: () => {
      showToast.success("Variantes criadas", "As variantes foram criadas com sucesso")
    },
  })

  const [updateVariant] = useMutation(UPDATE_PRODUCT_VARIANT, {
    refetchQueries: [{ query: GET_PRODUCT, variables: { id: productId } }],
    onCompleted: () => {
      showToast.success("Variante atualizada", "As alterações foram salvas")
    },
  })

  const [deleteVariant] = useMutation(DELETE_PRODUCT_VARIANT, {
    refetchQueries: [{ query: GET_PRODUCT, variables: { id: productId } }],
    onCompleted: () => {
      showToast.success("Variante excluída", "A variante foi removida")
    },
  })

  const [createPrice] = useMutation(CREATE_PRICE, {
    refetchQueries: [{ query: GET_PRODUCT, variables: { id: productId } }],
  })

  const [updatePrice] = useMutation(UPDATE_PRICE, {
    refetchQueries: [{ query: GET_PRODUCT, variables: { id: productId } }],
  })

  const addOption = () => {
    setOptions([
      ...options,
      {
        id: `option-${Date.now()}`,
        title: "",
        values: [],
      },
    ])
  }

  const removeOption = (optionId: string) => {
    setOptions(options.filter((opt) => opt.id !== optionId))
  }

  const updateOptionTitle = (optionId: string, title: string) => {
    setOptions(
      options.map((opt) => (opt.id === optionId ? { ...opt, title } : opt))
    )
  }

  const addOptionValue = (optionId: string, value: string) => {
    if (!value.trim()) return

    setOptions(
      options.map((opt) => {
        if (opt.id === optionId) {
          if (!opt.values.includes(value.trim())) {
            return { ...opt, values: [...opt.values, value.trim()] }
          }
        }
        return opt
      })
    )
  }

  const removeOptionValue = (optionId: string, value: string) => {
    setOptions(
      options.map((opt) =>
        opt.id === optionId
          ? { ...opt, values: opt.values.filter((v) => v !== value) }
          : opt
      )
    )
  }

  const handleInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, optionId: string) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      const input = e.currentTarget
      const value = input.value.trim()
      if (value) {
        addOptionValue(optionId, value)
        input.value = ""
      }
    }
  }

  const generateVariants = () => {
    if (generatedCombinations.length === 0) {
      showToast.error("Erro", "Defina pelo menos uma opção com valores")
      return
    }

    // Inicializar combinações se ainda não existirem
    const newCombinations: ProductVariantCombination[] = generatedCombinations.map((combo) => {
      // Verificar se já existe uma combinação similar
      const existing = variantCombinations.find((vc) => {
        const vcKeys = Object.keys(vc.optionValues).sort()
        const comboKeys = Object.keys(combo).sort()
        if (vcKeys.length !== comboKeys.length) return false

        return vcKeys.every((key) => vc.optionValues[key] === combo[key])
      })

      return existing || {
        optionValues: combo,
        price: "",
        stock: 0,
        sku: "",
      }
    })

    setVariantCombinations(newCombinations)
    showToast.success("Variantes geradas", `${newCombinations.length} variantes foram geradas`)
  }

  const updateCombination = (index: number, field: keyof ProductVariantCombination, value: any) => {
    const updated = [...variantCombinations]
    updated[index] = { ...updated[index], [field]: value }
    setVariantCombinations(updated)
  }

  const saveAllVariants = async () => {
    try {
      for (const combo of variantCombinations) {
        if (!combo.price || parseFloat(combo.price) <= 0) {
          showToast.error("Erro", "Todas as variantes devem ter um preço")
          return
        }

        const metadata: Record<string, any> = {
          attributes: combo.optionValues,
        }
        if (combo.sku) {
          metadata.sku = combo.sku
        }
        if (combo.image) {
          metadata.image = combo.image
        }

        const priceData = {
          nickname: "Preço padrão",
          unitAmount: Math.round(parseFloat(combo.price) * 100),
          currency: "CVE",
        }

        if (combo.id) {
          // Atualizar variante existente
          await updateVariant({
            variables: {
              id: combo.id,
              input: {
                title: Object.values(combo.optionValues).join(" / "),
                quantity: combo.stock || 0,
                metadata: JSON.stringify(metadata),
                productId,
              },
            },
          })

          // Atualizar preço se existir
          const existingVariant = existingVariants.find((v) => v.id === combo.id)
          if (existingVariant?.price?.id) {
            await updatePrice({
              variables: {
                id: existingVariant.price.id,
                input: priceData,
              },
            })
          }
        } else {
          // Criar nova variante
          await createVariant({
            variables: {
              input: {
                productId,
                title: Object.values(combo.optionValues).join(" / "),
                quantity: combo.stock || 0,
                metadata: JSON.stringify(metadata),
                priceData,
              },
            },
          })
        }
      }

      showToast.success("Sucesso", "Todas as variantes foram salvas")
    } catch (error: any) {
      showToast.error("Erro", error.message || "Erro ao salvar variantes")
    }
  }

  const deleteCombination = (index: number) => {
    const combo = variantCombinations[index]
    if (combo.id) {
      // Se tem ID, deletar do backend
      deleteVariant({ variables: { id: combo.id } })
    }
    // Remover da lista local
    setVariantCombinations(variantCombinations.filter((_, i) => i !== index))
  }

  const getCombinationLabel = (optionValues: Record<string, string>) => {
    return Object.entries(optionValues)
      .map(([key, value]) => `${key}: ${value}`)
      .join(" / ")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1200px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Opções e Variantes de Produto</DialogTitle>
          <DialogDescription>
            Defina as opções do produto (Cor, Capacidade, etc.) e suas variantes. 
            O sistema gerará automaticamente todas as combinações possíveis.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">Carregando...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Toggle para ativar variantes */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label className="text-base font-medium">Activar variantes para este produto</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  As opções permitem criar variações do produto (Cor, Tamanho, etc.)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveVariants(!activeVariants)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  activeVariants ? "bg-green-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    activeVariants ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {activeVariants && (
              <>
                {/* Seção de Opções */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Opções do Produto</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Defina as opções (ex: Cor, Capacidade) e seus valores possíveis
                      </p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addOption}>
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Adicionar Opção
                    </Button>
                  </div>

                  {options.map((option) => (
                    <div key={option.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 space-y-2">
                          <Label>Título da Opção</Label>
                          <Input
                            value={option.title}
                            onChange={(e) => updateOptionTitle(option.id, e.target.value)}
                            placeholder="Ex: Cor, Capacidade, Tamanho"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeOption(option.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label>Variantes da Opção</Label>
                        <div className="flex flex-wrap gap-2 items-center">
                          {option.values.map((value) => (
                            <Badge
                              key={value}
                              variant="secondary"
                              className="px-3 py-1 flex items-center gap-1"
                            >
                              {value}
                              <button
                                type="button"
                                onClick={() => removeOptionValue(option.id, value)}
                                className="ml-1 hover:text-red-600"
                              >
                                <XIcon className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                          <Input
                            placeholder="Ex: Azul, Verde"
                            className="w-48 h-8 text-sm"
                            onKeyPress={(e) => handleInputKeyPress(e, option.id)}
                            onBlur={(e) => {
                              if (e.target.value.trim()) {
                                addOptionValue(option.id, e.target.value.trim())
                                e.target.value = ""
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Botão para gerar variantes */}
                {options.length > 0 && generatedCombinations.length > 0 && (
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={variantCombinations.length > 0}
                        onChange={generateVariants}
                        className="h-4 w-4"
                      />
                      <Label className="text-sm">
                        Criar variantes de produto com os valores acima definidos (Preço, Stock, SKU, Imagem)
                      </Label>
                    </div>
                    <Badge variant="secondary">
                      Total de variantes: {generatedCombinations.length}
                    </Badge>
                  </div>
                )}

                {/* Tabela de Variantes Geradas */}
                {variantCombinations.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">Variantes do Produto</Label>
                      <Button onClick={saveAllVariants} size="sm">
                        Salvar Todas as Variantes
                      </Button>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-muted/50 border-b">
                            <tr>
                              <th className="text-left p-3 text-xs font-medium text-muted-foreground">
                                Variante
                              </th>
                              <th className="text-left p-3 text-xs font-medium text-muted-foreground">
                                Preço (CVE)
                              </th>
                              <th className="text-left p-3 text-xs font-medium text-muted-foreground">
                                Stock
                              </th>
                              <th className="text-left p-3 text-xs font-medium text-muted-foreground">
                                SKU
                              </th>
                              <th className="text-left p-3 text-xs font-medium text-muted-foreground">
                                Imagem
                              </th>
                              <th className="text-right p-3 text-xs font-medium text-muted-foreground">
                                Ações
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {variantCombinations.map((combo, index) => (
                              <tr
                                key={index}
                                className="border-b hover:bg-muted/30 transition-colors"
                              >
                                <td className="p-3">
                                  <div className="font-medium text-sm">
                                    {getCombinationLabel(combo.optionValues)}
                                  </div>
                                </td>
                                <td className="p-3">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={combo.price}
                                    onChange={(e) => updateCombination(index, "price", e.target.value)}
                                    placeholder="0.00"
                                    className="h-8 text-sm w-32"
                                  />
                                </td>
                                <td className="p-3">
                                  <Input
                                    type="number"
                                    min="0"
                                    value={combo.stock}
                                    onChange={(e) => updateCombination(index, "stock", parseInt(e.target.value) || 0)}
                                    className="h-8 text-sm w-24"
                                  />
                                </td>
                                <td className="p-3">
                                  <Input
                                    value={combo.sku || ""}
                                    onChange={(e) => updateCombination(index, "sku", e.target.value)}
                                    placeholder="SKU"
                                    className="h-8 text-sm w-32"
                                  />
                                </td>
                                <td className="p-3">
                                  <VariantImageUpload
                                    value={combo.image || ""}
                                    onChange={(imageUrl) => updateCombination(index, "image", imageUrl)}
                                    disabled={false}
                                  />
                                </td>
                                <td className="p-3">
                                  <div className="flex items-center justify-end gap-1">
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0 text-destructive"
                                      onClick={() => deleteCombination(index)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
