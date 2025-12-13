"use client"

import { useState, useEffect } from "react"
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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface CreateCategoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: Category | null
  onSuccess?: () => void
}

export function CreateCategoryModal({
  open,
  onOpenChange,
  category,
  onSuccess,
}: CreateCategoryModalProps) {
  const isEditMode = !!category

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    image: "",
    icon: "",
    orderIndex: 0,
    parentCategoryId: "",
    status: "ACTIVE",
  })

  // Buscar lista de categorias para o seletor de categoria pai
  const { data: categoriesData } = useQuery(GET_CATEGORY_LIST, {
    skip: !open,
  })

  const categories = categoriesData?.categoryList || []

  const [createCategory, { loading: creating }] = useMutation(CREATE_CATEGORY, {
    onCompleted: () => {
      onSuccess?.()
    },
  })

  const [updateCategory, { loading: updating }] = useMutation(UPDATE_CATEGORY, {
    onCompleted: () => {
      onSuccess?.()
    },
  })

  const loading = creating || updating

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || "",
        slug: category.slug || "",
        description: category.description || "",
        image: category.image || "",
        icon: category.icon || "",
        orderIndex: category.orderIndex || 0,
        parentCategoryId: category.parentCategory?.id || "",
        status: category.status?.code || "ACTIVE",
      })
    } else {
      resetForm()
    }
  }, [category, open])

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      image: "",
      icon: "",
      orderIndex: 0,
      parentCategoryId: "",
      status: "ACTIVE",
    })
  }

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
    setFormData({ ...formData, name })
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
      icon: formData.icon || null,
      orderIndex: formData.orderIndex || null,
      parentCategoryId: formData.parentCategoryId || null,
      status: {
        code: formData.status,
      },
    }

    if (isEditMode && category) {
      await updateCategory({
        variables: {
          id: category.id,
          input,
        },
      })
    } else {
      await createCategory({
        variables: {
          input,
        },
      })
    }
  }

  // Filtrar categorias para não permitir selecionar a própria categoria como pai
  const availableParentCategories = isEditMode && category
    ? categories.filter((cat: Category) => cat.id !== category.id)
    : categories

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Editar Categoria" : "Criar Categoria"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Atualize as informações da categoria."
              : "Adicione uma nova categoria para organizar seus produtos."}
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
                placeholder="Ex: Eletrônicos"
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
                placeholder="ex: eletronicos"
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
              placeholder="Descrição da categoria"
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
              <Label htmlFor="icon">Ícone</Label>
              <Input
                id="icon"
                value={formData.icon}
                onChange={(e) =>
                  setFormData({ ...formData, icon: e.target.value })
                }
                placeholder="Ex: 📱, 🖥️"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="parentCategoryId">Categoria Pai</Label>
              <Select
                value={formData.parentCategoryId}
                onValueChange={(value) =>
                  setFormData({ ...formData, parentCategoryId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nenhuma (categoria principal)" />
                </SelectTrigger>
                <SelectContent>
                  {availableParentCategories.map((cat: Category) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
                : "Criar Categoria"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

