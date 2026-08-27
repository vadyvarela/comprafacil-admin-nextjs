"use client"

import { useState, useEffect, useMemo } from "react"
import { useMutation, useQuery } from "@apollo/client/react"
import {
  CREATE_PRODUCT_VARIANT,
  UPDATE_PRODUCT_VARIANT,
  DELETE_PRODUCT_VARIANT,
} from "@/lib/graphql/variants/mutations"
import { UPDATE_PRODUCT } from "@/lib/graphql/products/mutations"
import { UPDATE_PRICE } from "@/lib/graphql/prices/mutations"
import { GET_PRODUCT } from "@/lib/graphql/products/queries"
import type { Product } from "@/lib/graphql/products/types"
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
import { showToast } from "@/lib/utils/toast"
import { getErrorMessage } from "@/lib/utils/errors"
import { looksLikeIphoneProduct } from "@/lib/utils/iphone-seminovo-metadata"
import { Plus, Trash2, X as XIcon, Settings2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  deriveOptionCatalogFromVariants,
  mergeProductMetadataAttributes,
} from "@/lib/products/option-catalog"
import {
  buildVariantMetadataJson,
  variantMetadataToInput,
} from "@/lib/products/variant-metadata"
import type { ProductVariant } from "@/lib/graphql/products/types"
import { VariantDetailDialog } from "./variant-detail-dialog"
import type { ProductVariantCombination } from "./variant-manager-types"

interface VariantManagerProps {
  productId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ProductOption {
  id: string
  title: string
  values: string[]
}

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
  const existingVariants = useMemo(() => product?.variants ?? [], [product?.variants])

  const [options, setOptions] = useState<ProductOption[]>([])
  const [variantCombinations, setVariantCombinations] = useState<ProductVariantCombination[]>([])
  const [activeVariants, setActiveVariants] = useState(true)
  const [savingVariants, setSavingVariants] = useState(false)
  const [detailIndex, setDetailIndex] = useState<number | null>(null)

  const showIphoneSeminovoFields = useMemo(() => {
    if (product?.condition !== "seminovo" && product?.condition !== "usado") return false
    return looksLikeIphoneProduct({
      title: product.title ?? "",
      categoryName: product.category?.name,
      categorySlug: product.category?.slug,
      brandName: product.brand?.name,
    })
  }, [product])

  useEffect(() => {
    if (existingVariants.length > 0) {
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
          } catch {
            /* ignore */
          }
        }
      })

      const optionsArray: ProductOption[] = Object.entries(extractedOptions).map(
        ([title, valuesSet], index) => ({
          id: `option-${index}`,
          title,
          values: Array.from(valuesSet),
        }),
      )

      if (optionsArray.length > 0) {
        setOptions(optionsArray)
      }

      const combinations: ProductVariantCombination[] = existingVariants.map((variant) => {
        let optionValues: Record<string, string> = {}
        if (variant.metadata) {
          try {
            const metadata = JSON.parse(variant.metadata)
            optionValues = metadata.attributes || {}
          } catch {
            /* ignore */
          }
        }

        const metaFields = variantMetadataToInput(variant.image, variant.metadata)

        return {
          id: variant.id,
          optionValues,
          price: variant.price ? (variant.price.unitAmount / 100).toFixed(2) : "",
          stock: variant.quantity || 0,
          image: metaFields.image,
          images: metaFields.images,
          hoverImageUrl: metaFields.hoverImageUrl,
          sku: metaFields.sku,
          semFaceId: metaFields.semFaceId,
          batteryHealthPercent: metaFields.batteryHealthPercent,
          offerEnabled: metaFields.offerEnabled,
          offerTitle: metaFields.offerTitle,
          offerItems: metaFields.offerItems,
          discount: metaFields.discount,
          originalPrice: metaFields.originalPrice,
          metaCatalog: metaFields.metaCatalog,
        }
      })

      setVariantCombinations(combinations)
    }
  }, [existingVariants])

  const generatedCombinations = useMemo(() => {
    if (options.length === 0) return []

    const generate = (
      opts: ProductOption[],
      index = 0,
      current: Record<string, string> = {},
    ): Record<string, string>[] => {
      if (index >= opts.length) return [current]

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
  })

  const [updateVariant] = useMutation(UPDATE_PRODUCT_VARIANT, {
    refetchQueries: [{ query: GET_PRODUCT, variables: { id: productId } }],
  })

  const [deleteVariant] = useMutation(DELETE_PRODUCT_VARIANT, {
    refetchQueries: [{ query: GET_PRODUCT, variables: { id: productId } }],
    onCompleted: () => {
      showToast.success("Variante excluída", "A variante foi removida")
    },
  })

  const [updatePrice] = useMutation(UPDATE_PRICE, {
    refetchQueries: [{ query: GET_PRODUCT, variables: { id: productId } }],
  })

  const [updateProduct] = useMutation(UPDATE_PRODUCT, {
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
    setOptions(options.map((opt) => (opt.id === optionId ? { ...opt, title } : opt)))
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
      }),
    )
  }

  const removeOptionValue = (optionId: string, value: string) => {
    setOptions(
      options.map((opt) =>
        opt.id === optionId ? { ...opt, values: opt.values.filter((v) => v !== value) } : opt,
      ),
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

    const newCombinations: ProductVariantCombination[] = generatedCombinations.map((combo) => {
      const existing = variantCombinations.find((vc) => {
        const vcKeys = Object.keys(vc.optionValues).sort()
        const comboKeys = Object.keys(combo).sort()
        if (vcKeys.length !== comboKeys.length) return false
        return vcKeys.every((key) => vc.optionValues[key] === combo[key])
      })

      return (
        existing || {
          optionValues: combo,
          price: "",
          stock: 0,
          sku: "",
          offerTitle: "Pack de proteção",
          offerItems: [],
          metaCatalog: undefined,
        }
      )
    })

    setVariantCombinations(newCombinations)
    showToast.success("Variantes geradas", `${newCombinations.length} variantes foram geradas`)
  }

  const updateCombination = <K extends keyof ProductVariantCombination>(
    index: number,
    field: K,
    value: ProductVariantCombination[K],
  ) => {
    const updated = [...variantCombinations]
    updated[index] = { ...updated[index], [field]: value }
    setVariantCombinations(updated)
  }

  const buildVariantMetadata = (
    combo: ProductVariantCombination,
    imageOverride?: string | null,
  ): string => {
    const existing = combo.id ? existingVariants.find((v) => v.id === combo.id) : undefined
    const galleryUrls =
      combo.images && combo.images.length > 0
        ? combo.images
        : combo.image?.trim()
          ? [combo.image.trim()]
          : []

    const cover =
      imageOverride !== undefined
        ? (imageOverride ?? "").trim()
        : galleryUrls[0] || combo.image?.trim() || ""

    return buildVariantMetadataJson(existing?.metadata, {
      attributes: combo.optionValues,
      sku: combo.sku,
      image: cover || undefined,
      images: galleryUrls,
      hoverImageUrl: combo.hoverImageUrl,
      semFaceId: combo.semFaceId,
      batteryHealthPercent: combo.batteryHealthPercent,
      offerEnabled: combo.offerEnabled,
      offerTitle: combo.offerTitle,
      offerItems: combo.offerItems,
      discount: combo.discount,
      originalPrice: combo.originalPrice,
      metaCatalog: combo.metaCatalog,
    }, imageOverride)
  }

  const resolveVariantImage = (combo: ProductVariantCombination): string | undefined => {
    const fromGallery = combo.images?.[0]?.trim()
    if (fromGallery) return fromGallery
    const fromCombo = combo.image?.trim()
    if (fromCombo) return fromCombo
    if (!combo.id) return undefined
    const existing = existingVariants.find((v) => v.id === combo.id)
    if (existing?.image?.trim()) return existing.image.trim()
    if (existing?.metadata) {
      try {
        const meta = JSON.parse(existing.metadata) as { image?: string }
        if (typeof meta.image === "string" && meta.image.trim()) return meta.image.trim()
      } catch {
        /* ignore */
      }
    }
    return undefined
  }

  const syncProductOptionCatalog = async (combinations: ProductVariantCombination[]) => {
    if (!product || combinations.length === 0) return

    const variantRows: ProductVariant[] = combinations.map((combo, index) => ({
      id: combo.id ?? `temp-${index}`,
      title: Object.values(combo.optionValues).join(" / "),
      quantity: combo.stock || 0,
      image: resolveVariantImage(combo) ?? null,
      metadata: buildVariantMetadata(combo, resolveVariantImage(combo)),
    }))

    const catalog = deriveOptionCatalogFromVariants(variantRows)
    if (catalog.length === 0) return

    const metadata = mergeProductMetadataAttributes(product.metadata, catalog)
    const productType = product.type ? { code: product.type.code } : { code: "TICKET" }

    await updateProduct({
      variables: {
        id: productId,
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
  }

  const saveAllVariants = async () => {
    if (savingVariants) return

    setSavingVariants(true)
    try {
      let createdCount = 0
      let updatedCount = 0

      for (const combo of variantCombinations) {
        if (!combo.price || parseFloat(combo.price) <= 0) {
          showToast.error("Erro", "Todas as variantes devem ter um preço")
          return
        }

        if (combo.offerEnabled && (combo.offerItems?.length ?? 0) === 0) {
          showToast.error(
            "Oferta incompleta",
            `Adiciona itens à oferta da variante «${getCombinationLabel(combo.optionValues)}» ou desactiva-a.`,
          )
          return
        }

        const imageUrl = resolveVariantImage(combo)
        const metadataJson = buildVariantMetadata(combo, imageUrl)

        const priceData = {
          nickname: "Preço padrão",
          unitAmount: Math.round(parseFloat(combo.price) * 100),
          currency: "CVE",
        }

        if (combo.id) {
          await updateVariant({
            variables: {
              id: combo.id,
              input: {
                title: Object.values(combo.optionValues).join(" / "),
                quantity: combo.stock || 0,
                ...(imageUrl ? { image: imageUrl } : {}),
                metadata: metadataJson,
                productId,
              },
            },
          })

          const existingVariant = existingVariants.find((v) => v.id === combo.id)
          if (existingVariant?.price?.id) {
            await updatePrice({
              variables: {
                id: existingVariant.price.id,
                input: priceData,
              },
            })
          }
          updatedCount += 1
        } else {
          await createVariant({
            variables: {
              input: {
                productId,
                title: Object.values(combo.optionValues).join(" / "),
                quantity: combo.stock || 0,
                ...(imageUrl ? { image: imageUrl } : {}),
                metadata: metadataJson,
                priceData,
              },
            },
          })
          createdCount += 1
        }
      }

      const parts: string[] = []
      if (createdCount > 0) parts.push(`${createdCount} criada${createdCount > 1 ? "s" : ""}`)
      if (updatedCount > 0) parts.push(`${updatedCount} atualizada${updatedCount > 1 ? "s" : ""}`)

      try {
        await syncProductOptionCatalog(variantCombinations)
        parts.push("catálogo da loja atualizado")
      } catch {
        parts.push("catálogo da loja não sincronizado")
      }

      const description = parts.length > 0 ? parts.join(" • ") : "Nenhuma alteração detectada"
      showToast.success("Variantes salvas", description)
    } catch (error: unknown) {
      showToast.error("Erro", getErrorMessage(error, "Erro ao salvar variantes"))
    } finally {
      setSavingVariants(false)
    }
  }

  const deleteCombination = (index: number) => {
    const combo = variantCombinations[index]
    if (combo.id) {
      deleteVariant({ variables: { id: combo.id } })
    }
    setVariantCombinations(variantCombinations.filter((_, i) => i !== index))
  }

  const getCombinationLabel = (optionValues: Record<string, string>) => {
    return Object.entries(optionValues)
      .map(([key, value]) => `${key}: ${value}`)
      .join(" / ")
  }

  const detailCombo = detailIndex !== null ? variantCombinations[detailIndex] ?? null : null

  const handleDetailSave = (updated: ProductVariantCombination) => {
    if (detailIndex === null) return
    const next = [...variantCombinations]
    next[detailIndex] = updated
    setVariantCombinations(next)
  }

  const galleryCount = (combo: ProductVariantCombination) =>
    combo.images?.length ?? (combo.image ? 1 : 0)

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[1200px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Opções e Variantes de Produto</DialogTitle>
            <DialogDescription>
              Defina opções, preços, stock e detalhes por variante (galeria, bateria, ofertas).
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-muted-foreground">Carregando...</p>
            </div>
          ) : (
            <div className="space-y-6">
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
                          Criar variantes com os valores acima (Preço, Stock, Detalhes por variante)
                        </Label>
                      </div>
                      <Badge variant="secondary">
                        Total de variantes: {generatedCombinations.length}
                      </Badge>
                    </div>
                  )}

                  {variantCombinations.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-medium">Variantes do Produto</Label>
                        <Button onClick={saveAllVariants} size="sm" disabled={savingVariants}>
                          {savingVariants ? "A guardar..." : "Salvar Todas as Variantes"}
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
                                  Detalhes
                                </th>
                                <th className="text-right p-3 text-xs font-medium text-muted-foreground">
                                  Ações
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {variantCombinations.map((combo, index) => (
                                <tr
                                  key={combo.id ?? `combo-${index}`}
                                  className="border-b hover:bg-muted/30 transition-colors"
                                >
                                  <td className="p-3">
                                    <div className="font-medium text-sm">
                                      {getCombinationLabel(combo.optionValues)}
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {galleryCount(combo) > 0 && (
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                          {galleryCount(combo)} foto{galleryCount(combo) !== 1 ? "s" : ""}
                                        </Badge>
                                      )}
                                      {combo.discount && parseInt(combo.discount, 10) > 0 && (
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-rose-700">
                                          -{combo.discount}%
                                        </Badge>
                                      )}
                                      {combo.offerEnabled && (
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-orange-700">
                                          Pack
                                        </Badge>
                                      )}
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
                                      onChange={(e) =>
                                        updateCombination(index, "stock", parseInt(e.target.value) || 0)
                                      }
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
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      className="h-8 text-xs gap-1.5"
                                      onClick={() => setDetailIndex(index)}
                                      disabled={savingVariants}
                                    >
                                      <Settings2 className="h-3.5 w-3.5" />
                                      Galeria &amp; mais
                                    </Button>
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

      <VariantDetailDialog
        open={detailIndex !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setDetailIndex(null)
        }}
        combo={detailCombo}
        comboLabel={detailCombo ? getCombinationLabel(detailCombo.optionValues) : ""}
        showIphoneSeminovoFields={showIphoneSeminovoFields}
        brandSlug={product?.brand?.slug}
        disabled={savingVariants}
        onSave={handleDetailSave}
      />
    </>
  )
}
