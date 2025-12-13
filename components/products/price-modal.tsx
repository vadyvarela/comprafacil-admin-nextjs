"use client"

import { useState, useEffect } from "react"
import { useMutation } from "@apollo/client/react"
import { CREATE_PRICE, UPDATE_PRICE } from "@/lib/graphql/prices/mutations"
import { GET_PRODUCT } from "@/lib/graphql/products/queries"
import { Price } from "@/lib/graphql/prices/types"
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
import { showToast } from "@/lib/utils/toast"

interface PriceModalProps {
  variantId: string
  price: Price | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const CURRENCIES = [
  { code: "CVE", name: "Escudo Cabo-verdiano" },
  { code: "EUR", name: "Euro" },
  { code: "USD", name: "Dólar Americano" },
]

export function PriceModal({
  variantId,
  price,
  open,
  onOpenChange,
}: PriceModalProps) {
  const [formData, setFormData] = useState({
    nickname: "",
    unitAmount: "",
    currency: "CVE",
  })

  const isEditMode = !!price

  const [createPrice, { loading: creating }] = useMutation(CREATE_PRICE, {
    refetchQueries: [{ query: GET_PRODUCT }],
    onCompleted: () => {
      showToast.success("Preço criado", "O preço foi criado com sucesso")
      onOpenChange(false)
      resetForm()
    },
    onError: (error) => {
      console.error("Error creating price:", error)
      showToast.error("Erro ao criar preço", error.message || "Não foi possível criar o preço")
    },
  })

  const [updatePrice, { loading: updating }] = useMutation(UPDATE_PRICE, {
    refetchQueries: [{ query: GET_PRODUCT }],
    onCompleted: () => {
      showToast.success("Preço atualizado", "O preço foi atualizado com sucesso")
      onOpenChange(false)
      resetForm()
    },
    onError: (error) => {
      console.error("Error updating price:", error)
      showToast.error("Erro ao atualizar preço", error.message || "Não foi possível atualizar o preço")
    },
  })

  const loading = creating || updating

  useEffect(() => {
    if (open) {
      if (price) {
        setFormData({
          nickname: price.nickname || "",
          unitAmount: price.unitAmount ? (price.unitAmount / 100).toString() : "",
          currency: price.currency || "CVE",
        })
      } else {
        resetForm()
      }
    }
  }, [price, open])

  const resetForm = () => {
    setFormData({
      nickname: "",
      unitAmount: "",
      currency: "CVE",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const unitAmountInCents = Math.round(parseFloat(formData.unitAmount) * 100)

    if (isEditMode && price) {
      await updatePrice({
        variables: {
          id: price.id,
          input: {
            nickname: formData.nickname,
            unitAmount: unitAmountInCents,
            currency: formData.currency,
          },
        },
      })
    } else {
      await createPrice({
        variables: {
          input: {
            nickname: formData.nickname,
            productVariantId: variantId,
            unitAmount: unitAmountInCents,
            currency: formData.currency,
          },
        },
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Editar Preço" : "Criar Preço"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Atualize o preço da variante."
              : "Defina o preço para esta variante."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nickname">Nome/Descrição *</Label>
            <Input
              id="nickname"
              value={formData.nickname}
              onChange={(e) =>
                setFormData({ ...formData, nickname: e.target.value })
              }
              required
              placeholder="Ex: Preço padrão, Preço promocional"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unitAmount">Valor *</Label>
            <Input
              id="unitAmount"
              type="number"
              step="0.01"
              min="0"
              value={formData.unitAmount}
              onChange={(e) =>
                setFormData({ ...formData, unitAmount: e.target.value })
              }
              required
              placeholder="0.00"
            />
            <p className="text-xs text-muted-foreground">
              O valor será armazenado em centavos (ex: 100.00 = 10000 centavos)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Moeda *</Label>
            <Select
              value={formData.currency}
              onValueChange={(value) =>
                setFormData({ ...formData, currency: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a moeda" />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                : "Criar Preço"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

