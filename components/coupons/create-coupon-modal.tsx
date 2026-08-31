"use client"

import { useState } from "react"
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
import { recordAuditLog } from "@/lib/actions/auditLogs"
import { showToast } from "@/lib/utils/toast"
import { getErrorMessage } from "@/lib/utils/errors"

interface CreateCouponModalProps {
  coupon?: Coupon | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

type CouponProductOption = {
  id: string
  title: string
}

type CouponFormData = {
  name: string
  discountType: "percent" | "amount"
  percentOff: string
  amountOff: string
  currency: string
  duration: "ONCE" | "REPEATING" | "FOREVER"
  durationInMonths: string
  maxRedemptions: string
  redeemBy: string
  appliesToProductId: string
  defaultCoupon: boolean
}

function emptyCouponForm(): CouponFormData {
  return {
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
  }
}

function couponToForm(coupon: Coupon | null | undefined): CouponFormData {
  if (!coupon) return emptyCouponForm()
  return {
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
  }
}

export function CreateCouponModal({
  coupon,
  open,
  onOpenChange,
}: CreateCouponModalProps) {
  const isEditMode = !!coupon
  const formKey = coupon?.id ?? "new"
  const baseFormData = couponToForm(coupon)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [formDraft, setFormDraft] = useState<{ key: string; data: CouponFormData } | null>(null)
  const formData = formDraft?.key === formKey ? formDraft.data : baseFormData

  function setFormData(value: React.SetStateAction<CouponFormData>) {
    setFormDraft((prev) => {
      const current = prev?.key === formKey ? prev.data : baseFormData
      return {
        key: formKey,
        data: typeof value === "function" ? value(current) : value,
      }
    })
  }

  function resetForm() {
    setFormDraft(null)
  }

  const { data: productsData } = useQuery(GET_PRODUCT_LIST, {
    variables: { filter: null, page: { page: 0, size: 100 } },
    skip: !open,
  })

  const products = (productsData as { products?: { data: CouponProductOption[] } } | undefined)?.products?.data || []

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
        void recordAuditLog({
          action: "COUPON_UPDATED",
          entityType: "COUPON",
          entityId: coupon.id,
          metadata: { name: formData.name.trim() },
        })
      } else {
        const result = await createCoupon({
          variables: {
            input,
          },
        })
        const createdId = (result.data as { createCoupon?: { id?: string } } | undefined)
          ?.createCoupon?.id
        if (createdId) {
          void recordAuditLog({
            action: "COUPON_CREATED",
            entityType: "COUPON",
            entityId: createdId,
            metadata: { name: formData.name.trim() },
          })
        }
      }
    } catch (err) {
      console.error("Error saving coupon:", err)
      showToast.error("Erro ao guardar cupão", getErrorMessage(err, "Não foi possível guardar o cupão."))
    }
  }

  const loading = creating || updating

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen)
        if (!nextOpen) {
          resetForm()
          setShowAdvanced(false)
        }
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Editar cupão" : "Novo cupão"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Actualize as informações do cupão"
              : "Crie um novo cupão de desconto"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
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
                <SelectItem value="percent">Percentagem (%)</SelectItem>
                <SelectItem value="amount">Valor fixo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Valor do Desconto */}
          {formData.discountType === "percent" ? (
            <div className="space-y-2">
              <Label htmlFor="percentOff">
                Percentagem de desconto <span className="text-destructive">*</span>
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
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amountOff">
                  Valor do desconto <span className="text-destructive">*</span>
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
              <Label htmlFor="durationInMonths">Duração em meses</Label>
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

          {/* Opções avançadas */}
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="h-9 w-full justify-between bg-muted/20 px-3"
            >
              <span className="text-sm font-semibold">Opções avançadas</span>
              {showAdvanced ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>

            {showAdvanced && (
              <div className="space-y-4 rounded-lg border border-border/70 bg-muted/20 p-3">
                <div className="space-y-2">
                  <Label htmlFor="maxRedemptions">Máximo de utilizações</Label>
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
                  <Label htmlFor="redeemBy">Válido até</Label>
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
                  <Label htmlFor="appliesToProductId">Aplicar a produto</Label>
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
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2 rounded-md border border-border/70 bg-background px-3 py-2">
                  <input
                    type="checkbox"
                    id="defaultCoupon"
                    checked={formData.defaultCoupon}
                    onChange={(e) =>
                      setFormData({ ...formData, defaultCoupon: e.target.checked })
                    }
                    disabled={loading}
                    className="h-4 w-4 rounded border border-input"
                  />
                  <Label htmlFor="defaultCoupon" className="text-sm cursor-pointer">
                    Cupão padrão
                  </Label>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
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
                  {isEditMode ? "A guardar..." : "A criar..."}
                </>
              ) : (
                isEditMode ? "Guardar" : "Criar cupão"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
