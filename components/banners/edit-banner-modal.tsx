"use client"

import { useState, useEffect, useRef } from "react"
import { useMutation } from "@apollo/client/react"
import { UPDATE_BANNER } from "@/lib/graphql/banners/mutations"
import { GET_BANNERS } from "@/lib/graphql/banners/queries"
import { updateBannerWithImage } from "@/lib/services/banner-upload"
import { Banner } from "@/lib/graphql/banners/types"
import { Image as ImageIcon, X } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { Loader2 } from "lucide-react"
import { showToast } from "@/lib/utils/toast"

interface EditBannerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  banner: Banner
}

// Formata Date para o formato aceito pelo gateway (sem milissegundos / Z)
function toGatewayDateTime(date: Date | undefined): string | null {
  if (!date) return null
  // Ex: "2026-03-04T02:00:00"
  return date.toISOString().slice(0, 19)
}

export function EditBannerModal({
  open,
  onOpenChange,
  banner,
}: EditBannerModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    description: "",
    image: "",
    link: "",
    buttonText: "",
    position: "hero",
    orderIndex: 0,
    status: "ACTIVE",
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
  })

  const [updateBanner, { loading, error }] = useMutation<{
    updateBanner: { title: string }
  }>(UPDATE_BANNER, {
    refetchQueries: [{ query: GET_BANNERS }],
    onCompleted: (data) => {
      showToast.success("Banner atualizado", `O banner "${data.updateBanner.title}" foi atualizado com sucesso`)
      onOpenChange(false)
    },
  })

  useEffect(() => {
    if (banner && open) {
      setFormData({
        title: banner.title || "",
        subtitle: banner.subtitle || "",
        description: banner.description || "",
        image: banner.image || "",
        link: banner.link || "",
        buttonText: banner.buttonText || "",
        position: banner.position || "hero",
        orderIndex: banner.orderIndex || 0,
        status: banner.status?.code || "ACTIVE",
        startDate: banner.startDate ? new Date(banner.startDate) : undefined,
        endDate: banner.endDate ? new Date(banner.endDate) : undefined,
      })
      setImagePreview(banner.image || null)
      setSelectedImage(null)
    }
  }, [banner, open])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith("image/")) {
        showToast.error("Formato inválido", "Por favor, selecione um arquivo de imagem")
        return
      }
      
      if (file.size > 10 * 1024 * 1024) {
        showToast.error("Arquivo muito grande", "A imagem deve ter no máximo 10MB")
        return
      }

      setSelectedImage(file)
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    if (banner.image) {
      setImagePreview(banner.image)
    } else {
      setImagePreview(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      showToast.error("Campos obrigatórios", "Título é obrigatório")
      return
    }

    if (!selectedImage && !formData.image.trim()) {
      showToast.error("Campos obrigatórios", "É necessário fazer upload de uma imagem")
      return
    }

    setUploading(true)

    try {
      if (selectedImage) {
        // Usar REST API com upload de imagem
        await updateBannerWithImage(
          banner.id,
          {
            title: formData.title.trim(),
            subtitle: formData.subtitle.trim() || null,
            description: formData.description.trim() || null,
            image: formData.image.trim() || null,
            link: formData.link.trim() || null,
            buttonText: formData.buttonText.trim() || null,
            position: formData.position || "hero",
            orderIndex: formData.orderIndex || 0,
            status: {
              code: formData.status,
              description: formData.status === "ACTIVE" ? "Ativo" : "Inativo",
            },
            startDate: toGatewayDateTime(formData.startDate),
            endDate: toGatewayDateTime(formData.endDate),
          },
          selectedImage
        )
        
        onOpenChange(false)
      } else {
        // Usar GraphQL se não há imagem nova
        await updateBanner({
          variables: {
            id: banner.id,
            input: {
              title: formData.title.trim(),
              subtitle: formData.subtitle.trim() || null,
              description: formData.description.trim() || null,
              image: formData.image.trim(),
              link: formData.link.trim() || null,
              buttonText: formData.buttonText.trim() || null,
              position: formData.position || "hero",
              orderIndex: formData.orderIndex || 0,
              status: {
                code: formData.status,
                description: formData.status === "ACTIVE" ? "Ativo" : "Inativo",
              },
              startDate: toGatewayDateTime(formData.startDate),
              endDate: toGatewayDateTime(formData.endDate),
            },
          },
        })
      }
    } catch (err: any) {
      console.error("Error updating banner:", err)
      showToast.error("Erro ao atualizar banner", err.message || "Ocorreu um erro ao atualizar o banner")
    } finally {
      setUploading(false)
    }
  }

  const isLoading = loading || uploading

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-2xl font-semibold">Editar Banner</DialogTitle>
          <DialogDescription className="text-base mt-2">
            Atualize as informações do banner. Campos marcados com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm border border-destructive/20">
            <p className="font-medium">Erro ao atualizar banner</p>
            <p className="mt-1 text-xs">{error.message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Título <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
                placeholder="Título do banner"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtítulo</Label>
              <Input
                id="subtitle"
                value={formData.subtitle}
                onChange={(e) =>
                  setFormData({ ...formData, subtitle: e.target.value })
                }
                placeholder="Subtítulo (opcional)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Descrição do banner"
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">
                Imagem <span className="text-destructive">*</span>
              </Label>
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="image"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  {selectedImage ? "Trocar Imagem" : "Trocar Imagem"}
                </Button>
                {imagePreview && (
                  <div className="mt-2 relative w-full h-48 rounded-md overflow-hidden border group">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    {selectedImage && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={handleRemoveImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
                {selectedImage && (
                  <p className="text-xs text-muted-foreground">
                    {selectedImage.name} ({(selectedImage.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="link">Link</Label>
                <Input
                  id="link"
                  type="url"
                  value={formData.link}
                  onChange={(e) =>
                    setFormData({ ...formData, link: e.target.value })
                  }
                  placeholder="/produtos"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="buttonText">Texto do Botão</Label>
                <Input
                  id="buttonText"
                  value={formData.buttonText}
                  onChange={(e) =>
                    setFormData({ ...formData, buttonText: e.target.value })
                  }
                  placeholder="Ver Mais"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="position">Posição</Label>
                <Select
                  value={formData.position}
                  onValueChange={(value) =>
                    setFormData({ ...formData, position: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hero">Hero</SelectItem>
                    <SelectItem value="promo">Promo</SelectItem>
                    <SelectItem value="sidebar">Sidebar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="orderIndex">Ordem</Label>
                <Input
                  id="orderIndex"
                  type="number"
                  value={formData.orderIndex}
                  onChange={(e) =>
                    setFormData({ ...formData, orderIndex: parseInt(e.target.value) || 0 })
                  }
                  min="0"
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de Início</Label>
                <DatePicker
                  date={formData.startDate}
                  onSelect={(date) =>
                    setFormData({ ...formData, startDate: date || undefined })
                  }
                  placeholder="Selecione data de início"
                />
              </div>

              <div className="space-y-2">
                <Label>Data de Fim</Label>
                <DatePicker
                  date={formData.endDate}
                  onSelect={(date) =>
                    setFormData({ ...formData, endDate: date || undefined })
                  }
                  placeholder="Selecione data de fim"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Atualizando...
                </>
              ) : (
                "Atualizar Banner"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

