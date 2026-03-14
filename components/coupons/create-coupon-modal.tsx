"use client"

import { useState, useEffect } from "react"
import { useMutation, useQuery } from "@apollo/client/react"
import { CREATE_COUPON, UPDATE_COUPON } from "@/lib/graphql/coupons/mutations"
import { GET_COUPONS } from "@/lib/graphql/coupons/queries"
import { GET_PRODUCT_LIST } from "@/lib/graphql/products/queries"
import { Coupon } from "@/lib/graphql/coupons/types"
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
import { Loader2, ChevronDown, ChevronUp } from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface CreateCouponModalProps {
  coupon?: Coupon | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateCouponModal({
  coupon,
  open,
  onOpenChange,
}: CreateCouponModalProps) {
  const isEditMode = !!coupon
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    discountType: "percent" as "percent" | "amount",
    percentOff: "",
    amountOff: "",
    currency: "CVE",
    duration: "ONCE" as "ONCE" | "REPEATING" | "FOREVER",
    durationInMonths: "",
    maxRedemptions: "",
    redeemBy: "",
    appliesToProductId: "none",
    defaultCoupon: false,
  })

  const { data: productsData } = useQuery(GET_PRODUCT_LIST, {
    variables: { page: { page: 0, size: 100 } },
    skip: !open,
  })

  const products = (productsData as { products?: { data: unknown[] } } | undefined)?.products?.data || []

  const [createCoupon, { loading: creating }] = useMutation(CREATE_COUPON, {
    refetchQueries: [{ query: GET_COUPONS }],
    onCompleted: () => {
      onOpenChange(false)
      resetForm()
    },
  })

  const [updateCoupon, { loading: updating }] = useMutation(UPDATE_COUPON, {
    refetchQueries: [{ query: GET_COUPONS }],
    onCompleted: () => {
      onOpenChange(false)
    },
  })

  useEffect(() => {
    if (coupon && open) {
      setFormData({
        name: coupon.name || "",
        discountType: coupon.percentOff ? "percent" : "amount",
        percentOff: coupon.percentOff?.toString() || "",
        amountOff: coupon.amountOff?.toString() || "",
        currency: coupon.currency || "CVE",
        duration: (coupon.duration as "ONCE" | "REPEATING" | "FOREVER") || "ONCE",
        durationInMonths: coupon.durationInMonths?.toString() || "",
        maxRedemptions: coupon.maxRedemptions?.toString() || "",
        redeemBy: coupon.redeemBy
          ? new Date(coupon.redeemBy).toISOString().split("T")[0]
          : "",
        appliesToProductId: coupon.appliesToProductId || "none",
        defaultCoupon: coupon.defaultCoupon || false,
      })
    } else if (!open) {
      resetForm()
      setShowAdvanced(false)
    }
  }, [coupon, open])

  const resetForm = () => {
    setFormData({
      name: "",
      discountType: "percent",
      percentOff: "",
      amountOff: "",
      currency: "CVE",
      duration: "ONCE",
      durationInMonths: "",
      maxRedemptions: "",
      redeemBy: "",
      appliesToProductId: "none",
      defaultCoupon: false,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      return
    }

    const input = {
      name: formData.name.trim(),
      duration: formData.duration,
      ...(formData.discountType === "percent"
        ? {
            percentOff: formData.percentOff ? parseFloat(formData.percentOff) : null,
            amountOff: null,
            currency: null,
          }
        : {
            amountOff: formData.amountOff ? parseFloat(formData.amountOff) : null,
            currency: formData.currency,
            percentOff: null,
          }),
      ...(formData.durationInMonths && {
        durationInMonths: parseInt(formData.durationInMonths),
      }),
      ...(formData.maxRedemptions && {
        maxRedemptions: parseInt(formData.maxRedemptions),
      }),
      ...(formData.redeemBy && {
        // Backend GraphQL rejeita ISO com "Z"; enviar como YYYY-MM-DDTHH:mm:ss
        redeemBy: `${formData.redeemBy}T12:00:00`,
      }),
      ...(formData.appliesToProductId &&
        formData.appliesToProductId !== "none" && {
          appliesToProductId: formData.appliesToProductId,
        }),
      defaultCoupon: formData.defaultCoupon,
    }

    try {
      if (isEditMode && coupon) {
        await updateCoupon({
          variables: {
            id: coupon.id,
            input,
          },
        })
      } else {
        await createCoupon({
          variables: {
            input,
          },
        })
      }
    } catch (err) {
      console.error("Error saving coupon:", err)
    }
  }

  const loading = creating || updating

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold">
            {isEditMode ? "Editar cupom" : "Novo cupom"}
          </DialogTitle>
          <DialogDescription className="text-sm mt-1">
            {isEditMode
              ? "Atualize as informações do cupom"
              : "Crie um novo cupom de desconto"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Nome <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              placeholder="Ex: Desconto de Verão"
              disabled={loading}
            />
          </div>

          {/* Tipo de Desconto */}
          <div className="space-y-2">
            <Label htmlFor="discountType">Tipo de Desconto *</Label>
            <Select
              value={formData.discountType}
              onValueChange={(value: "percent" | "amount") =>
                setFormData({ ...formData, discountType: value })
              }
              disabled={loading}
            >
              <SelectTrigger id="discountType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percent">Percentual (%)</SelectItem>
                <SelectItem value="amount">Valor Fixo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Valor do Desconto */}
          {formData.discountType === "percent" ? (
            <div className="space-y-2">
              <Label htmlFor="percentOff">
                Percentual de Desconto <span className="text-destructive">*</span>
              </Label>
              <Input
                id="percentOff"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.percentOff}
                onChange={(e) =>
                  setFormData({ ...formData, percentOff: e.target.value })
                }
                required
                placeholder="Ex: 10"
                disabled={loading}
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amountOff">
                  Valor do Desconto <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="amountOff"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.amountOff}
                  onChange={(e) =>
                    setFormData({ ...formData, amountOff: e.target.value })
                  }
                  required
                  placeholder="Ex: 50"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Moeda *</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) =>
                    setFormData({ ...formData, currency: value })
                  }
                  disabled={loading}
                >
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CVE">CVE</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Duração */}
          <div className="space-y-2">
            <Label htmlFor="duration">
              Duração <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.duration}
              onValueChange={(value: "ONCE" | "REPEATING" | "FOREVER") =>
                setFormData({ ...formData, duration: value })
              }
              disabled={loading}
            >
              <SelectTrigger id="duration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ONCE">Uma vez</SelectItem>
                <SelectItem value="REPEATING">Repetir</SelectItem>
                <SelectItem value="FOREVER">Para sempre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.duration === "REPEATING" && (
            <div className="space-y-2">
              <Label htmlFor="durationInMonths">Duração em Meses</Label>
              <Input
                id="durationInMonths"
                type="number"
                min="1"
                value={formData.durationInMonths}
                onChange={(e) =>
                  setFormData({ ...formData, durationInMonths: e.target.value })
                }
                placeholder="Ex: 3"
                disabled={loading}
              />
            </div>
          )}

          {/* Opções Avançadas */}
          <div className="space-y-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full justify-between"
            >
              <span className="text-sm font-medium">Opções Avançadas</span>
              {showAdvanced ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>

            {showAdvanced && (
              <div className="space-y-4 pt-2 border-t">
                <div className="space-y-2">
                  <Label htmlFor="maxRedemptions">Máximo de Resgates</Label>
                  <Input
                    id="maxRedemptions"
                    type="number"
                    min="1"
                    value={formData.maxRedemptions}
                    onChange={(e) =>
                      setFormData({ ...formData, maxRedemptions: e.target.value })
                    }
                    placeholder="Sem limite"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="redeemBy">Válido Até</Label>
                  <Input
                    id="redeemBy"
                    type="date"
                    value={formData.redeemBy}
                    onChange={(e) =>
                      setFormData({ ...formData, redeemBy: e.target.value })
                    }
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="appliesToProductId">Aplicar a Produto</Label>
                  <Select
                    value={formData.appliesToProductId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, appliesToProductId: value })
                    }
                    disabled={loading}
                  >
                    <SelectTrigger id="appliesToProductId">
                      <SelectValue placeholder="Todos os produtos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Todos os produtos</SelectItem>
                      {products.map((product: any) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="defaultCoupon"
                    checked={formData.defaultCoupon}
                    onChange={(e) =>
                      setFormData({ ...formData, defaultCoupon: e.target.checked })
                    }
                    disabled={loading}
                    className="h-4 w-4 rounded border"
                  />
                  <Label htmlFor="defaultCoupon" className="text-sm cursor-pointer">
                    Cupom padrão
                  </Label>
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
            <Button type="submit" disabled={loading || !formData.name.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? "Salvando..." : "Criando..."}
                </>
              ) : (
                isEditMode ? "Salvar" : "Criar Cupom"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

