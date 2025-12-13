"use client"

import { useState, useEffect, useMemo } from "react"
import { useMutation, useQuery } from "@apollo/client/react"
import { UPDATE_PRODUCT } from "@/lib/graphql/products/mutations"
import { GET_PRODUCT } from "@/lib/graphql/products/queries"
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
import { Separator } from "@/components/ui/separator"
import { showToast } from "@/lib/utils/toast"
import { Plus, Trash2, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ProductAttributesManagerProps {
  productId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ProductAttribute {
  name: string // Nome do atributo (ex: "Cor", "Capacidade")
  values: string[] // Valores possíveis (ex: ["Preta", "Branca"])
}

/**
 * Componente para gerenciar atributos do produto e gerar variantes automaticamente
 * Funciona como sistemas de e-commerce: define atributos -> gera combinações -> cria variantes
 */
export function ProductAttributesManager({
  productId,
  open,
  onOpenChange,
}: ProductAttributesManagerProps) {
  const { data: productData, loading: productLoading } = useQuery(GET_PRODUCT, {
    variables: { id: productId },
    skip: !productId || !open,
  })

  const product = productData?.productDetails

  // Extrair atributos do metadata do produto
  const [attributes, setAttributes] = useState<ProductAttribute[]>([])
  
  useEffect(() => {
    if (product?.metadata) {
      try {
        const metadata = JSON.parse(product.metadata)
        if (metadata.attributes && Array.isArray(metadata.attributes)) {
          setAttributes(metadata.attributes)
        } else {
          // Se não houver atributos, resetar para array vazio
          setAttributes([])
        }
      } catch (e) {
        // Ignore parse errors, resetar para array vazio
        setAttributes([])
      }
    } else if (product && !product.metadata) {
      // Se o produto não tem metadata, resetar atributos
      setAttributes([])
    }
  }, [product?.metadata, product])

  const [updateProduct] = useMutation(UPDATE_PRODUCT, {
    refetchQueries: [{ query: GET_PRODUCT, variables: { id: productId } }],
    onCompleted: () => {
      showToast.success("Atributos salvos", "Os atributos do produto foram salvos com sucesso")
    },
  })

  const [createVariant] = useMutation(CREATE_PRODUCT_VARIANT, {
    refetchQueries: [{ query: GET_PRODUCT, variables: { id: productId } }],
  })

  // Calcular todas as combinações possíveis de atributos
  const combinations = useMemo(() => {
    if (attributes.length === 0) return []

    const generateCombinations = (attrs: ProductAttribute[]): Record<string, string>[] => {
      if (attrs.length === 0) return [{}]
      
      const [first, ...rest] = attrs
      const restCombinations = generateCombinations(rest)
      const result: Record<string, string>[] = []

      first.values.forEach(value => {
        restCombinations.forEach(combo => {
          result.push({ [first.name]: value, ...combo })
        })
      })

      return result
    }

    return generateCombinations(attributes)
  }, [attributes])

  const addAttribute = () => {
    setAttributes([...attributes, { name: "", values: [""] }])
  }

  const removeAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index))
  }

  const updateAttributeName = (index: number, name: string) => {
    const newAttributes = [...attributes]
    newAttributes[index].name = name
    setAttributes(newAttributes)
  }

  const addAttributeValue = (attrIndex: number) => {
    const newAttributes = [...attributes]
    newAttributes[attrIndex].values.push("")
    setAttributes(newAttributes)
  }

  const removeAttributeValue = (attrIndex: number, valueIndex: number) => {
    const newAttributes = [...attributes]
    newAttributes[attrIndex].values = newAttributes[attrIndex].values.filter(
      (_, i) => i !== valueIndex
    )
    setAttributes(newAttributes)
  }

  const updateAttributeValue = (attrIndex: number, valueIndex: number, value: string) => {
    const newAttributes = [...attributes]
    newAttributes[attrIndex].values[valueIndex] = value
    setAttributes(newAttributes)
  }

  const handleSaveAttributes = async () => {
    // Validar atributos
    for (const attr of attributes) {
      if (!attr.name || attr.name.trim() === "") {
        showToast.error("Erro", "Todos os atributos devem ter um nome")
        return
      }
      if (attr.values.length === 0 || attr.values.some(v => !v || v.trim() === "")) {
        showToast.error("Erro", "Todos os atributos devem ter pelo menos um valor válido")
        return
      }
    }

    // Salvar atributos no metadata do produto
    const currentMetadata = product?.metadata ? JSON.parse(product.metadata) : {}
    const newMetadata = {
      ...currentMetadata,
      attributes: attributes.map(attr => ({
        name: attr.name,
        values: attr.values.filter(v => v.trim() !== ""),
      })),
    }

    await updateProduct({
      variables: {
        id: productId,
        input: {
          title: product?.title || "",
          description: product?.description || null,
          type: product?.type || { code: "TICKET" },
          metadata: JSON.stringify(newMetadata),
        },
      },
    })
  }

  const handleGenerateVariants = async () => {
    if (combinations.length === 0) {
      showToast.error("Erro", "Defina os atributos primeiro antes de gerar variantes")
      return
    }

    // Verificar se já existem variantes
    const existingVariants = product?.variants || []
    if (existingVariants.length > 0) {
      if (
        !confirm(
          `Já existem ${existingVariants.length} variantes. Gerar novas variantes pode criar duplicatas. Deseja continuar?`
        )
      ) {
        return
      }
    }

    try {
      // Criar cada combinação como uma variante
      for (const combo of combinations) {
        // Criar título da variante baseado na combinação
        const variantTitle = Object.entries(combo)
          .map(([key, value]) => `${value}`)
          .join(" - ")

        // Verificar se já existe uma variante com esses atributos
        const existingVariant = existingVariants.find((v: any) => {
          try {
            const vMetadata = v.metadata ? JSON.parse(v.metadata) : {}
            const vAttributes = vMetadata.attributes || {}
            return (
              Object.keys(combo).length === Object.keys(vAttributes).length &&
              Object.entries(combo).every(([key, value]) => vAttributes[key] === value)
            )
          } catch {
            return false
          }
        })

        if (existingVariant) {
          continue // Pular se já existe
        }

        // Criar metadata da variante com os atributos
        const variantMetadata = {
          attributes: combo,
        }

        await createVariant({
          variables: {
            input: {
              productId,
              title: variantTitle,
              quantity: 0, // Quantidade inicial 0, deve ser editada depois
              metadata: JSON.stringify(variantMetadata),
            },
          },
        })
      }

      showToast.success(
        "Variantes geradas",
        `${combinations.length} variantes foram geradas com sucesso. Edite cada uma para definir preço e quantidade.`
      )
    } catch (error: any) {
      showToast.error("Erro", error.message || "Erro ao gerar variantes")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Atributos e Variantes</DialogTitle>
          <DialogDescription>
            Defina os atributos do produto (ex: Cor, Capacidade) e seus valores possíveis.
            O sistema gerará automaticamente todas as combinações como variantes.
          </DialogDescription>
        </DialogHeader>

        {productLoading && !product ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">Carregando...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Seção de Atributos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Atributos do Produto</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Exemplo: Cor (Preta, Branca) e Capacidade (128GB, 256GB)
                  gerará 4 variantes: Preta 128GB, Preta 256GB, Branca 128GB, Branca 256GB
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addAttribute}>
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Atributo
              </Button>
            </div>

            {attributes.length > 0 && (
              <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                {attributes.map((attr, attrIndex) => (
                  <div key={attrIndex} className="space-y-3 border-b last:border-b-0 pb-4 last:pb-0">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 space-y-2">
                        <Label className="text-sm font-medium">Nome do Atributo</Label>
                        <Input
                          value={attr.name}
                          onChange={(e) => updateAttributeName(attrIndex, e.target.value)}
                          placeholder="Ex: Cor, Capacidade, Tamanho"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAttribute(attrIndex)}
                        className="shrink-0 mt-6"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Valores possíveis</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => addAttributeValue(attrIndex)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Adicionar Valor
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {attr.values.map((value, valueIndex) => (
                          <div key={valueIndex} className="flex gap-2">
                            <Input
                              value={value}
                              onChange={(e) =>
                                updateAttributeValue(attrIndex, valueIndex, e.target.value)
                              }
                              placeholder={`Ex: ${attr.name === "Cor" ? "Preta" : attr.name === "Capacidade" ? "128GB" : "Valor"}`}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeAttributeValue(attrIndex, valueIndex)}
                              disabled={attr.values.length === 1}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preview de Combinações */}
          {combinations.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">
                    Combinações que serão criadas ({combinations.length} variantes)
                  </Label>
                  <Badge variant="secondary">{combinations.length} variantes</Badge>
                </div>
                <div className="border rounded-lg p-4 bg-muted/30 max-h-48 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-2">
                    {combinations.map((combo, index) => (
                      <div
                        key={index}
                        className="text-sm p-2 bg-background rounded border"
                      >
                        {Object.entries(combo)
                          .map(([key, value]) => (
                            <Badge key={key} variant="outline" className="mr-1">
                              {value}
                            </Badge>
                          ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveAttributes}
            disabled={attributes.length === 0}
          >
            Salvar Atributos
          </Button>
          <Button
            type="button"
            onClick={handleGenerateVariants}
            disabled={combinations.length === 0}
          >
            <Zap className="h-4 w-4 mr-2" />
            Gerar {combinations.length > 0 ? `${combinations.length} ` : ""}Variantes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

