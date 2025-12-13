"use client"

import { useState, useEffect } from "react"
import { useMutation } from "@apollo/client/react"
import { UPDATE_STOCK, CREATE_STOCK } from "@/lib/graphql/stocks/mutations"
import { GET_PRODUCT } from "@/lib/graphql/products/queries"
import { Stock } from "@/lib/graphql/stocks/types"
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

interface StockModalProps {
  stock: Stock | null
  open: boolean
  onOpenChange: (open: boolean) => void
  productId?: string
}

export function StockModal({ stock, open, onOpenChange, productId }: StockModalProps) {
  const [formData, setFormData] = useState({
    quantity: 0,
    name: "",
  })

  const [updateStock, { loading: updating }] = useMutation(UPDATE_STOCK, {
    refetchQueries: [{ query: GET_PRODUCT, variables: { id: stock?.productId || productId } }],
    onCompleted: () => {
      onOpenChange(false)
      resetForm()
    },
  })

  const [createStock, { loading: creating }] = useMutation(CREATE_STOCK, {
    refetchQueries: [{ query: GET_PRODUCT, variables: { id: productId } }],
    onCompleted: () => {
      onOpenChange(false)
      resetForm()
    },
  })

  const loading = updating || creating
  const isEditMode = !!stock

  useEffect(() => {
    if (stock) {
      setFormData({
        quantity: stock.quantity || 0,
        name: stock.name || "",
      })
    } else {
      resetForm()
    }
  }, [stock, open])

  const resetForm = () => {
    setFormData({
      quantity: 0,
      name: "",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isEditMode && stock) {
      await updateStock({
        variables: {
          stockId: stock.id,
          input: {
            name: formData.name || `Stock - ${stock.productId}`,
            quantity: formData.quantity,
          },
        },
      })
    } else if (productId) {
      await createStock({
        variables: {
          input: {
            productId,
            name: formData.name || `Stock - ${productId}`,
            quantity: formData.quantity,
          },
        },
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Atualizar Estoque' : 'Criar Estoque'}</DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Atualize a quantidade de estoque disponível para este produto.'
              : 'Configure o estoque inicial para este produto.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantidade *</Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              value={formData.quantity}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  quantity: parseInt(e.target.value) || 0,
                })
              }
              required
              placeholder="Quantidade em estoque"
            />
            <p className="text-sm text-muted-foreground">
              Esta quantidade será compartilhada entre todas as variantes do produto.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nome do Estoque</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Nome do estoque (opcional)"
            />
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
            <Button type="submit" disabled={loading || !productId && !stock}>
              {loading 
                ? "Salvando..." 
                : isEditMode 
                  ? "Salvar Alterações" 
                  : "Criar Estoque"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

