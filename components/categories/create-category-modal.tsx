"use client"

/* eslint-disable @next/next/no-img-element */

import { useState } from "react"
import { useMutation, useQuery } from "@apollo/client/react"
import { CREATE_CATEGORY, UPDATE_CATEGORY } from "@/lib/graphql/categories/mutations"
import { GET_CATEGORY_LIST } from "@/lib/graphql/categories/queries"
import { Category } from "@/lib/graphql/categories/types"
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
import { Field } from "@/components/products/product-form-layout"
import { MediaPickerDialog } from "@/components/media/media-picker-dialog"
import { getRootCategoriesForParentSelect } from "@/lib/categories/format-category-label"
import { showToast } from "@/lib/utils/toast"
import { getErrorMessage } from "@/lib/utils/errors"
import { FolderTree, ImagePlus, Loader2 } from "lucide-react"

interface CreateCategoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: Category | null
  onSuccess?: () => void
}

type CategoryFormData = {
  name: string
  slug: string
  description: string
  image: string
  icon: string
  orderIndex: number
  showOnHome: boolean
  homeOrder: string | number
  parentCategoryId: string
  status: string
}

function emptyCategoryForm(): CategoryFormData {
  return {
    name: "",
    slug: "",
    description: "",
    image: "",
    icon: "",
    orderIndex: 0,
    showOnHome: true,
    homeOrder: "",
    parentCategoryId: "none",
    status: "ACTIVE",
  }
}

function categoryToForm(category: Category | null | undefined): CategoryFormData {
  if (!category) return emptyCategoryForm()
  return {
    name: category.name || "",
    slug: category.slug || "",
    description: category.description || "",
    image: category.image || "",
    icon: category.icon || "",
    orderIndex: category.orderIndex || 0,
    showOnHome: category.showOnHome !== false,
    homeOrder: category.homeOrder ?? "",
    parentCategoryId: category.parentCategory?.id || "none",
    status: category.status?.code || "ACTIVE",
  }
}

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export function CreateCategoryModal({
  open,
  onOpenChange,
  category,
  onSuccess,
}: CreateCategoryModalProps) {
  const isEditMode = !!category
  const formKey = category?.id ?? "new"
  const baseFormData = categoryToForm(category)

  const [formDraft, setFormDraft] = useState<{ key: string; data: CategoryFormData } | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const formData = formDraft?.key === formKey ? formDraft.data : baseFormData

  function setFormData(value: React.SetStateAction<CategoryFormData>) {
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

  const { data: categoriesData } = useQuery<{
    categoryList: Category[]
  }>(GET_CATEGORY_LIST, {
    skip: !open,
  })

  const categories = categoriesData?.categoryList || []

  const [createCategory, { loading: creating }] = useMutation(CREATE_CATEGORY)
  const [updateCategory, { loading: updating }] = useMutation(UPDATE_CATEGORY)
  const loading = creating || updating

  const handleNameChange = (name: string) => {
    if (!isEditMode && (!formData.slug || formData.slug === generateSlug(formData.name))) {
      setFormData((prev) => ({ ...prev, name, slug: generateSlug(name) }))
    } else {
      setFormData((prev) => ({ ...prev, name }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const input = {
      name: formData.name,
      slug: formData.slug,
      description: formData.description || null,
      image: formData.image || null,
      icon: formData.icon || null,
      orderIndex: formData.orderIndex || null,
      showOnHome: formData.showOnHome,
      homeOrder:
        formData.homeOrder === "" || formData.homeOrder === undefined
          ? null
          : Number(formData.homeOrder),
      parentCategoryId:
        !formData.parentCategoryId || formData.parentCategoryId === "none"
          ? null
          : formData.parentCategoryId,
      status: {
        code: formData.status,
      },
    }

    try {
      if (isEditMode && category) {
        await updateCategory({ variables: { id: category.id, input } })
        showToast.success("Categoria actualizada", `"${formData.name}" foi guardada`)
      } else {
        await createCategory({ variables: { input } })
        showToast.success("Categoria criada", `"${formData.name}" está pronta a usar`)
      }
      onSuccess?.()
    } catch (err: unknown) {
      showToast.error(
        isEditMode ? "Erro ao guardar" : "Erro ao criar",
        getErrorMessage(err, "Não foi possível guardar a categoria."),
      )
    }
  }

  const availableParentCategories = getRootCategoriesForParentSelect(
    categories,
    isEditMode && category ? category.id : undefined,
  )

  const imageUrl = formData.image.trim()

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          onOpenChange(nextOpen)
          if (!nextOpen) resetForm()
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Editar categoria" : "Nova categoria"}</DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Actualize o nome, imagem e visibilidade na loja."
                : "Crie um grupo principal ou uma subcategoria do catálogo."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nome" htmlFor="name" required>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  placeholder="Ex.: Smartphones"
                  className="h-8 text-xs"
                />
              </Field>
              <Field label="Slug" htmlFor="slug" required hint="Usado na URL da loja">
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                  placeholder="smartphones"
                  className="h-8 text-xs font-mono"
                />
              </Field>
            </div>

            <Field label="Descrição" htmlFor="description">
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Opcional"
                rows={2}
                className="text-xs min-h-16"
              />
            </Field>

            <div className="space-y-1.5">
              <p className="text-xs font-medium">Imagem</p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted/40">
                  {imageUrl ? (
                    <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <FolderTree className="h-5 w-5 text-muted-foreground/40" />
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      id="image"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      placeholder="URL da imagem"
                      className="h-8 text-xs"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 shrink-0 text-xs gap-1.5"
                      onClick={() => setPickerOpen(true)}
                    >
                      <ImagePlus className="h-3.5 w-3.5" />
                      Biblioteca
                    </Button>
                  </div>
                  <Field label="Ícone" htmlFor="icon">
                    <Input
                      id="icon"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      placeholder="Emoji, se não houver imagem"
                      className="h-8 text-xs"
                    />
                  </Field>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Categoria pai" htmlFor="parentCategoryId">
                <Select
                  value={formData.parentCategoryId || "none"}
                  onValueChange={(value) => setFormData({ ...formData, parentCategoryId: value })}
                >
                  <SelectTrigger id="parentCategoryId" className="h-8 text-xs">
                    <SelectValue placeholder="Nenhuma (principal)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-xs">
                      Nenhuma (principal)
                    </SelectItem>
                    {availableParentCategories.map((cat: Category) => (
                      <SelectItem key={cat.id} value={cat.id} className="text-xs">
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Estado" htmlFor="status">
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger id="status" className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE" className="text-xs">
                      Activo
                    </SelectItem>
                    <SelectItem value="INACTIVE" className="text-xs">
                      Inactivo
                    </SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Ordem" htmlFor="orderIndex">
                <Input
                  id="orderIndex"
                  type="number"
                  min="0"
                  value={formData.orderIndex}
                  onChange={(e) =>
                    setFormData({ ...formData, orderIndex: parseInt(e.target.value) || 0 })
                  }
                  className="h-8 text-xs"
                />
              </Field>
              <Field label="Ordem na home" htmlFor="homeOrder">
                <Input
                  id="homeOrder"
                  type="number"
                  value={formData.homeOrder}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      homeOrder: e.target.value === "" ? "" : parseInt(e.target.value, 10) || 0,
                    })
                  }
                  placeholder="Automática"
                  className="h-8 text-xs"
                />
              </Field>
            </div>

            <label className="flex cursor-pointer flex-wrap items-center gap-2 rounded-md border border-border/80 bg-muted/20 px-3 py-2 text-xs transition-colors hover:bg-muted/35">
              <input
                type="checkbox"
                checked={formData.showOnHome}
                onChange={(e) => setFormData({ ...formData, showOnHome: e.target.checked })}
                className="rounded border-input"
              />
              <span className="font-medium text-foreground">Mostrar na home</span>
              <span className="text-muted-foreground">Rails e navegação da loja</span>
            </label>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  onOpenChange(false)
                  resetForm()
                }}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" size="sm" className="h-8 text-xs gap-1.5" disabled={loading}>
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {loading
                  ? isEditMode
                    ? "A guardar…"
                    : "A criar…"
                  : isEditMode
                    ? "Guardar"
                    : "Criar categoria"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <MediaPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        multiple={false}
        maxSelectable={1}
        onSelect={(urls) => {
          const url = urls[0]
          if (url) setFormData((prev) => ({ ...prev, image: url }))
        }}
        title="Imagem da categoria"
        description="Escolha uma imagem da biblioteca para esta categoria."
      />
    </>
  )
}
