"use client"

/* eslint-disable @next/next/no-img-element */

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { FormField } from "@/components/admin/form-field"
import { MediaPickerDialog } from "@/components/media/media-picker-dialog"
import { FolderOpen, X } from "lucide-react"
import { showToast } from "@/lib/utils/toast"
import { getErrorMessage } from "@/lib/utils/errors"

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
  const [pickerTarget, setPickerTarget] = useState<"image" | "logo" | null>(null)
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

    try {
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
    } catch (error: unknown) {
      showToast.error("Erro ao guardar marca", getErrorMessage(error, "Não foi possível guardar a marca."))
    }
  }

  const pickAsset = (target: "image" | "logo", urls: string[]) => {
    const url = urls[0]
    if (!url) return
    setFormData((prev) => ({ ...prev, [target]: url }))
    setPickerTarget(null)
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          onOpenChange(nextOpen)
          if (!nextOpen) resetForm()
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Editar marca" : "Criar marca"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Actualize as informações da marca."
              : "Adicione uma nova marca para organizar os produtos."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Nome *" htmlFor="name">
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                placeholder="Ex: Apple"
              />
            </FormField>

            <FormField
              label="Slug *"
              htmlFor="slug"
              description="URL amigável gerada automaticamente."
            >
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                required
                placeholder="ex: apple"
                className="font-mono"
              />
            </FormField>
          </div>

          <FormField label="Descrição" htmlFor="description">
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Descrição da marca"
              rows={3}
            />
          </FormField>

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Imagem da marca" htmlFor="image">
              {formData.image ? (
                <div className="relative h-24 overflow-hidden rounded-md border border-border/80 bg-muted/30">
                  <img src={formData.image} alt="" className="h-full w-full object-cover" />
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon-sm"
                    className="absolute right-1.5 top-1.5 h-7 w-7"
                    onClick={() => setFormData((prev) => ({ ...prev, image: "" }))}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : null}
              <div className="flex gap-2">
                <Input
                  id="image"
                  value={formData.image}
                  onChange={(e) =>
                    setFormData({ ...formData, image: e.target.value })
                  }
                  placeholder="URL da imagem"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setPickerTarget("image")}
                  aria-label="Escolher imagem da biblioteca"
                >
                  <FolderOpen className="h-3.5 w-3.5" />
                </Button>
              </div>
            </FormField>

            <FormField label="Logótipo" htmlFor="logo">
              {formData.logo ? (
                <div className="relative flex h-24 items-center justify-center overflow-hidden rounded-md border border-border/80 bg-muted/30 p-3">
                  <img src={formData.logo} alt="" className="max-h-full max-w-full object-contain" />
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon-sm"
                    className="absolute right-1.5 top-1.5 h-7 w-7"
                    onClick={() => setFormData((prev) => ({ ...prev, logo: "" }))}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : null}
              <div className="flex gap-2">
                <Input
                  id="logo"
                  value={formData.logo}
                  onChange={(e) =>
                    setFormData({ ...formData, logo: e.target.value })
                  }
                  placeholder="URL do logótipo"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setPickerTarget("logo")}
                  aria-label="Escolher logótipo da biblioteca"
                >
                  <FolderOpen className="h-3.5 w-3.5" />
                </Button>
              </div>
            </FormField>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Ordem" htmlFor="orderIndex">
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
            </FormField>

            <FormField label="Estado" htmlFor="status">
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
                  <SelectItem value="ACTIVE">Activo</SelectItem>
                  <SelectItem value="INACTIVE">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
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
                  ? "A guardar..."
                  : "A criar..."
                : isEditMode
                ? "Guardar alterações"
                : "Criar marca"}
            </Button>
          </DialogFooter>
        </form>
        </DialogContent>
      </Dialog>
      <MediaPickerDialog
        open={pickerTarget !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setPickerTarget(null)
        }}
        multiple={false}
        maxSelectable={1}
        onSelect={(urls) => {
          if (pickerTarget) pickAsset(pickerTarget, urls)
        }}
        title={pickerTarget === "logo" ? "Escolher logótipo" : "Escolher imagem"}
        description="Selecciona uma imagem já existente na biblioteca."
      />
    </>
  )
}

