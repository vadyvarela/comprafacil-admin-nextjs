"use client"

import { useState } from "react"
import { useMutation } from "@apollo/client/react"
import { useRouter } from "next/navigation"
import { CREATE_PRODUCT } from "@/lib/graphql/products/mutations"
import { GET_PRODUCTS } from "@/lib/graphql/products/queries"
import { CREATE_PRODUCT_VARIANT } from "@/lib/graphql/variants/mutations"
import { CREATE_PRICE } from "@/lib/graphql/prices/mutations"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function NewProductPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    discount: "",
    sku: "",
    price: "",
    quantity: "",
    createDefaultVariant: true, // Por padrão, criar variante padrão
  })

  const [createProduct, { loading, error }] = useMutation<{
    createProduct: { id: string }
  }>(CREATE_PRODUCT, {
    refetchQueries: [{ query: GET_PRODUCTS }],
  })

  const [createVariant] = useMutation(CREATE_PRODUCT_VARIANT)
  const [createPrice] = useMutation(CREATE_PRICE)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const metadata = {
        sku: formData.sku || null,
      }

      // Criar produto
      const { data: productData } = await createProduct({
        variables: {
          input: {
            title: formData.title,
            description: formData.description || null,
            discount: formData.discount ? parseInt(formData.discount) : null,
            type: {
              code: "TICKET", // Tipo usado no sistema
            },
            metadata: JSON.stringify(metadata),
          },
        },
      })

      const productId = productData?.createProduct?.id

      if (!productId) {
        throw new Error("Erro ao criar produto")
      }

      // Se preço foi fornecido e createDefaultVariant está ativo, criar variante padrão
      if (formData.createDefaultVariant && formData.price) {
        const priceAmount = parseFloat(formData.price)
        const quantity = parseInt(formData.quantity) || 0

        if (priceAmount > 0) {
          // Criar variante padrão
          const variantMetadata: Record<string, any> = {}
          if (formData.sku) {
            variantMetadata.sku = formData.sku
          }

          const { data: variantData } = await createVariant({
            variables: {
              input: {
                productId,
                title: formData.title, // Usar título do produto como título da variante padrão
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

          // O preço já é criado automaticamente quando priceData é fornecido
        }
      }

      // Redirecionar para página de detalhes do produto
      router.push(`/dashboard/products/${productId}`)
    } catch (err: unknown) {
      console.error("Error creating product:", err)
      // O erro será exibido pelo componente de erro
    }
  }

  return (
    <>
      <DashboardHeader items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Produtos", href: "/dashboard/products" }, { label: "Criar Produto" }]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <h1 className="text-2xl font-bold">Criar Novo Produto</h1>

          {error && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-md">
              <p className="font-semibold">Erro ao criar produto</p>
              <p className="text-sm mt-1">{error.message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-card border rounded-lg p-6 space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-2">
                Título *
              </label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
                placeholder="Nome do produto"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium mb-2"
              >
                Descrição
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full min-h-[100px] px-3 py-2 border rounded-md"
                placeholder="Descrição do produto"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="sku" className="block text-sm font-medium mb-2">
                  SKU
                </label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) =>
                    setFormData({ ...formData, sku: e.target.value })
                  }
                  placeholder="Código SKU"
                />
              </div>

              <div>
                <label htmlFor="discount" className="block text-sm font-medium mb-2">
                  Desconto (%)
                </label>
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
                />
                <label htmlFor="createDefaultVariant" className="text-sm font-medium">
                  Criar variante padrão com preço
                </label>
              </div>

              {formData.createDefaultVariant && (
                <div className="grid grid-cols-2 gap-4 pl-6">
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium mb-2">
                      Preço (CVE) *
                    </label>
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
                    />
                  </div>

                  <div>
                    <label htmlFor="quantity" className="block text-sm font-medium mb-2">
                      Quantidade em Estoque
                    </label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      value={formData.quantity}
                      onChange={(e) =>
                        setFormData({ ...formData, quantity: e.target.value })
                      }
                      placeholder="Ex: 10"
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

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Criando..." : "Criar Produto"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </div>
    </>
  )
}
