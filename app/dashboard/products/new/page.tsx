"use client"

import { useState } from "react"
import { useMutation } from "@apollo/client/react"
import { useRouter } from "next/navigation"
import { CREATE_PRODUCT } from "@/lib/graphql/products/mutations"
import { GET_PRODUCTS } from "@/lib/graphql/products/queries"
import { CREATE_PRODUCT_VARIANT } from "@/lib/graphql/variants/mutations"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Package, Tag, Layers, ArrowLeft, AlertCircle } from "lucide-react"

export default function NewProductPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    discount: "",
    condition: "novo",
    sku: "",
    price: "",
    quantity: "",
    createDefaultVariant: true,
  })

  const [createProduct, { loading, error }] = useMutation<{
    createProduct: { id: string }
  }>(CREATE_PRODUCT, {
    refetchQueries: [{ query: GET_PRODUCTS }],
  })

  const [createVariant] = useMutation(CREATE_PRODUCT_VARIANT)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { data: productData } = await createProduct({
        variables: {
          input: {
            title: formData.title,
            description: formData.description || null,
            discount: formData.discount ? parseInt(formData.discount) : null,
            condition: formData.condition,
            type: { code: "TICKET" },
            metadata: JSON.stringify({ sku: formData.sku || null }),
          },
        },
      })

      const productId = productData?.createProduct?.id
      if (!productId) throw new Error("Erro ao criar produto")

      if (formData.createDefaultVariant && formData.price) {
        const priceAmount = parseFloat(formData.price)
        if (priceAmount > 0) {
          await createVariant({
            variables: {
              input: {
                productId,
                title: formData.title,
                quantity: parseInt(formData.quantity) || 0,
                metadata: JSON.stringify(formData.sku ? { sku: formData.sku } : {}),
                priceData: {
                  nickname: "Preço padrão",
                  unitAmount: Math.round(priceAmount * 100),
                  currency: "CVE",
                },
              },
            },
          })
        }
      }

      router.push(`/dashboard/products/${productId}`)
    } catch (err) {
      console.error("Error creating product:", err)
    }
  }

  const set = (key: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFormData((prev) => ({ ...prev, [key]: e.target.value }))

  return (
    <>
      <DashboardHeader
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Produtos", href: "/dashboard/products" },
          { label: "Novo produto" },
        ]}
      />

      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-3xl mx-auto w-full">
        {/* Page title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-foreground">Novo produto</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Preencha as informações básicas do produto</p>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl border border-destructive/30 bg-destructive/5">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-destructive">Erro ao criar produto</p>
              <p className="text-xs text-muted-foreground mt-0.5">{error.message}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Informações básicas */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border bg-muted/30">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
                <Package className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-sm font-semibold text-foreground">Informações básicas</span>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label htmlFor="title" className="block text-xs font-medium text-foreground mb-1.5">
                  Título <span className="text-destructive">*</span>
                </label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={set("title")}
                  required
                  placeholder="Ex: iPhone 15 Pro Max 256GB"
                  className="h-9"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-xs font-medium text-foreground mb-1.5">
                  Descrição
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={set("description")}
                  rows={3}
                  className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 resize-none"
                  placeholder="Descrição detalhada do produto…"
                />
              </div>
            </div>
          </div>

          {/* Preço e stock */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border bg-muted/30">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/10">
                <Tag className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <span className="text-sm font-semibold text-foreground">Preço e stock</span>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="createDefaultVariant"
                  checked={formData.createDefaultVariant}
                  onChange={(e) => setFormData((prev) => ({ ...prev, createDefaultVariant: e.target.checked }))}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                <label htmlFor="createDefaultVariant" className="text-xs font-medium text-foreground cursor-pointer">
                  Criar variante padrão com preço e stock
                </label>
              </div>

              {formData.createDefaultVariant ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="price" className="block text-xs font-medium text-foreground mb-1.5">
                      Preço (CVE) <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">$</span>
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={set("price")}
                        placeholder="0.00"
                        required={formData.createDefaultVariant}
                        className="pl-7 h-9"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="quantity" className="block text-xs font-medium text-foreground mb-1.5">
                      Quantidade em stock
                    </label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      value={formData.quantity}
                      onChange={set("quantity")}
                      placeholder="0"
                      className="h-9"
                    />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                  O produto será criado sem variantes. Pode adicionar variantes na página de detalhes.
                </p>
              )}
            </div>
          </div>

          {/* Identificação */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border bg-muted/30">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-500/10">
                <Layers className="h-3.5 w-3.5 text-violet-600" />
              </div>
              <span className="text-sm font-semibold text-foreground">Identificação</span>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="sku" className="block text-xs font-medium text-foreground mb-1.5">
                    SKU
                  </label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={set("sku")}
                    placeholder="Ex: IPH-15PM-256"
                    className="h-9"
                  />
                </div>
                <div>
                  <label htmlFor="discount" className="block text-xs font-medium text-foreground mb-1.5">
                    Desconto (%)
                  </label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discount}
                    onChange={set("discount")}
                    placeholder="0"
                    className="h-9"
                  />
                </div>
                <div>
                  <label htmlFor="condition" className="block text-xs font-medium text-foreground mb-1.5">
                    Estado
                  </label>
                  <Select
                    value={formData.condition}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, condition: value }))}
                  >
                    <SelectTrigger id="condition" className="h-9">
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
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <Button type="submit" disabled={loading} className="min-w-32">
              {loading ? "A criar…" : "Criar produto"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}
