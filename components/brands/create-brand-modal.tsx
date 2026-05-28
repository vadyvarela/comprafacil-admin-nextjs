"use client"

import { useState } from "react"
import { useMutation } from "@apollo/client/react"
import { CREATE_BRAND, UPDATE_BRAND } from "@/lib/graphql/brands/mutations"
import { Brand } from "@/lib/graphql/brands/types"
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
import { Textarea } from "@/components/ui/textarea"

interface CreateBrandModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  brand?: Brand | null
  onSuccess?: () => void
}

type BrandFormData = {
  name: string
  slug: string
  description: string
  image: string
  logo: string
  orderIndex: number
  status: string
}

function emptyBrandForm(): BrandFormData {
  return {
    name: "",
    slug: "",
    description: "",
    image: "",
    logo: "",
    orderIndex: 0,
    status: "ACTIVE",
  }
}

function brandToForm(brand: Brand | null | undefined): BrandFormData {
  if (!brand) return emptyBrandForm()
  return {
    name: brand.name || "",
    slug: brand.slug || "",
    description: brand.description || "",
    image: brand.image || "",
    logo: brand.logo || "",
    orderIndex: brand.orderIndex || 0,
    status: brand.status?.code || "ACTIVE",
  }
}

export function CreateBrandModal({
  open,
  onOpenChange,
  brand,
  onSuccess,
}: CreateBrandModalProps) {
  const isEditMode = !!brand
  const formKey = brand?.id ?? "new"
  const baseFormData = brandToForm(brand)

  const [formDraft, setFormDraft] = useState<{ key: string; data: BrandFormData } | null>(null)
  const formData = formDraft?.key === formKey ? formDraft.data : baseFormData

  function setFormData(value: React.SetStateAction<BrandFormData>) {
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

  const [createBrand, { loading: creating }] = useMutation(CREATE_BRAND, {
    onCompleted: () => {
      onSuccess?.()
    },
  })

  const [updateBrand, { loading: updating }] = useMutation(UPDATE_BRAND, {
    onCompleted: () => {
      onSuccess?.()
    },
  })

  const loading = creating || updating

  // Gerar slug automaticamente a partir do nome
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  }

  const handleNameChange = (name: string) => {
    // Auto-gerar slug se estiver vazio ou se não estiver em modo de edição
    if (!isEditMode && (!formData.slug || formData.slug === generateSlug(formData.name))) {
      setFormData((prev) => ({ ...prev, name, slug: generateSlug(name) }))
    } else {
      setFormData({ ...formData, name })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const input = {
      name: formData.name,
      slug: formData.slug,
      description: formData.description || null,
      image: formData.image || null,
      logo: formData.logo || null,
      orderIndex: formData.orderIndex || null,
      status: {
        code: formData.status,
      },
    }

    if (isEditMode && brand) {
      await updateBrand({
        variables: {
          id: brand.id,
          input,
        },
      })
    } else {
      await createBrand({
        variables: {
          input,
        },
      })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen)
        if (!nextOpen) resetForm()
      }}
    >
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Editar Marca" : "Criar Marca"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Atualize as informações da marca."
              : "Adicione uma nova marca para organizar seus produtos."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                placeholder="Ex: Apple"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                required
                placeholder="ex: apple"
              />
              <p className="text-xs text-muted-foreground">
                URL amigável (gerado automaticamente)
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Descrição da marca"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="image">URL da Imagem</Label>
              <Input
                id="image"
                value={formData.image}
                onChange={(e) =>
                  setFormData({ ...formData, image: e.target.value })
                }
                placeholder="https://exemplo.com/imagem.jpg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo">URL do Logo</Label>
              <Input
                id="logo"
                value={formData.logo}
                onChange={(e) =>
                  setFormData({ ...formData, logo: e.target.value })
                }
                placeholder="https://exemplo.com/logo.png"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="orderIndex">Ordem</Label>
              <Input
                id="orderIndex"
                type="number"
                min="0"
                value={formData.orderIndex}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    orderIndex: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Ativo</SelectItem>
                  <SelectItem value="INACTIVE">Inativo</SelectItem>
                </SelectContent>
              </Select>
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
                : "Criar Marca"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

