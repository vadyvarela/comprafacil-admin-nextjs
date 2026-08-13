"use client"

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useRef, useState } from "react"
import { useApolloClient, useMutation } from "@apollo/client/react"
import { CREATE_BANNER, UPDATE_BANNER } from "@/lib/graphql/banners/mutations"
import { GET_BANNERS } from "@/lib/graphql/banners/queries"
import {
  createBannerWithImage,
  updateBannerWithImage,
} from "@/lib/services/banner-upload"
import { Banner } from "@/lib/graphql/banners/types"
import { MediaPickerDialog } from "@/components/media/media-picker-dialog"
import {
  FolderOpen,
  ImageIcon,
  Loader2,
  Upload,
  X,
} from "lucide-react"
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
import { showToast } from "@/lib/utils/toast"
import { getErrorMessage } from "@/lib/utils/errors"
import { cn } from "@/lib/utils"

type BannerFormModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  banner?: Banner | null
}

type FormState = {
  title: string
  subtitle: string
  description: string
  image: string
  link: string
  buttonText: string
  position: string
  orderIndex: number
  status: string
  startDate: Date | undefined
  endDate: Date | undefined
}

const EMPTY_FORM: FormState = {
  title: "",
  subtitle: "",
  description: "",
  image: "",
  link: "",
  buttonText: "",
  position: "hero",
  orderIndex: 0,
  status: "ACTIVE",
  startDate: undefined,
  endDate: undefined,
}

const POSITION_LABEL: Record<string, string> = {
  hero: "Hero",
  "hero-side": "Lateral",
  promo: "Promo",
  sidebar: "Sidebar",
}

function toIsoDateTime(date: Date | undefined): string | null {
  if (!date || Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

function bannerToForm(banner: Banner): FormState {
  return {
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
  }
}

function statusPayload(code: string) {
  return {
    code,
    description: code === "ACTIVE" ? "Ativo" : "Inativo",
  }
}

export function BannerFormModal({
  open,
  onOpenChange,
  banner,
}: BannerFormModalProps) {
  const isEdit = !!banner
  const fileInputRef = useRef<HTMLInputElement>(null)
  const client = useApolloClient()
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState<FormState>(EMPTY_FORM)

  const refetchBanners = useCallback(async () => {
    await client.refetchQueries({ include: [GET_BANNERS] })
  }, [client])

  const [createBanner, { loading: creating, error: createError }] = useMutation<{
    createBanner: { title: string }
  }>(CREATE_BANNER, {
    refetchQueries: [{ query: GET_BANNERS }],
    onCompleted: (data) => {
      showToast.success(
        "Banner criado",
        `“${data.createBanner.title}” foi criado`,
      )
      onOpenChange(false)
    },
  })

  const [updateBanner, { loading: updating, error: updateError }] = useMutation<{
    updateBanner: { title: string }
  }>(UPDATE_BANNER, {
    refetchQueries: [{ query: GET_BANNERS }],
    onCompleted: (data) => {
      showToast.success(
        "Banner atualizado",
        `“${data.updateBanner.title}” foi atualizado`,
      )
      onOpenChange(false)
    },
  })

  const reset = useCallback(() => {
    setFormData(EMPTY_FORM)
    setSelectedImage(null)
    setImagePreview(null)
    setPickerOpen(false)
    setDragging(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }, [])

  useEffect(() => {
    if (!open) {
      reset()
      return
    }
    if (banner) {
      setFormData(bannerToForm(banner))
      setImagePreview(banner.image || null)
      setSelectedImage(null)
    } else {
      reset()
    }
  }, [banner, open, reset])

  const applyFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast.error("Formato inválido", "Selecciona um ficheiro de imagem")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast.error("Ficheiro grande", "A imagem deve ter no máximo 10 MB")
      return
    }
    setSelectedImage(file)
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) applyFile(file)
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
    if (isEdit && banner?.image) {
      setImagePreview(banner.image)
      setFormData((prev) => ({ ...prev, image: banner.image }))
      return
    }
    setImagePreview(null)
    setFormData((prev) => ({ ...prev, image: "" }))
  }

  const applyFromLibrary = (urls: string[]) => {
    const url = urls[0]
    if (!url) return
    setSelectedImage(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
    setImagePreview(url)
    setFormData((prev) => ({ ...prev, image: url }))
    showToast.success("Imagem seleccionada", "Imagem da biblioteca aplicada")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      showToast.error("Campos obrigatórios", "Título é obrigatório")
      return
    }
    if (!selectedImage && !formData.image.trim()) {
      showToast.error("Campos obrigatórios", "Selecciona ou envia uma imagem")
      return
    }

    const payload = {
      title: formData.title.trim(),
      subtitle: formData.subtitle.trim() || null,
      description: formData.description.trim() || null,
      image: formData.image.trim() || null,
      link: formData.link.trim() || null,
      buttonText: formData.buttonText.trim() || null,
      position: formData.position || "hero",
      orderIndex: formData.orderIndex || 0,
      status: statusPayload(formData.status),
      startDate: toIsoDateTime(formData.startDate),
      endDate: toIsoDateTime(formData.endDate),
    }

    setUploading(true)
    try {
      if (isEdit && banner) {
        if (selectedImage) {
          await updateBannerWithImage(banner.id, payload, selectedImage)
          await refetchBanners()
          showToast.success("Banner atualizado", `“${payload.title}” foi atualizado`)
          onOpenChange(false)
        } else {
          await updateBanner({
            variables: {
              id: banner.id,
              input: { ...payload, image: payload.image || banner.image },
            },
          })
        }
        return
      }

      if (selectedImage) {
        await createBannerWithImage(payload, selectedImage)
        await refetchBanners()
        showToast.success("Banner criado", `“${payload.title}” foi criado`)
        onOpenChange(false)
        reset()
      } else {
        await createBanner({
          variables: {
            input: { ...payload, image: formData.image.trim() },
          },
        })
      }
    } catch (err: unknown) {
      showToast.error(
        isEdit ? "Erro ao atualizar banner" : "Erro ao criar banner",
        getErrorMessage(
          err,
          isEdit
            ? "Ocorreu um erro ao atualizar o banner"
            : "Ocorreu um erro ao criar o banner",
        ),
      )
    } finally {
      setUploading(false)
    }
  }

  const isLoading = creating || updating || uploading
  const error = createError || updateError
  const imageFromLibrary =
    !selectedImage && !!formData.image && formData.image === imagePreview
  const imageSourceLabel = selectedImage
    ? selectedImage.name
    : imageFromLibrary
      ? "Biblioteca"
      : imagePreview
        ? "Imagem atual"
        : null

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next && pickerOpen) return
          onOpenChange(next)
        }}
      >
        <DialogContent className="sm:max-w-215 gap-4 p-5 max-h-[92vh] overflow-y-auto">
          <DialogHeader className="space-y-1 pr-6">
            <DialogTitle className="text-base font-semibold">
              {isEdit ? "Editar banner" : "Novo banner"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Imagem, textos e agendamento do slide. Campos com * são obrigatórios.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <p className="font-medium">
                {isEdit ? "Erro ao atualizar" : "Erro ao criar"}
              </p>
              <p className="mt-0.5 opacity-90">{error.message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
              <div className="space-y-2">
                <Label className="text-xs">
                  Imagem <span className="text-destructive">*</span>
                </Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragging(true)
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDragging(false)
                    const file = e.dataTransfer.files?.[0]
                    if (file) applyFile(file)
                  }}
                  className={cn(
                    "relative overflow-hidden rounded-lg border bg-muted/30 transition-colors",
                    dragging
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-border/80",
                  )}
                >
                  <div className="relative aspect-video bg-zinc-950">
                    {imagePreview ? (
                      <>
                        <img
                          src={imagePreview}
                          alt="Pré-visualização do banner"
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-black/10" />
                        <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/70">
                            {POSITION_LABEL[formData.position] || formData.position}
                          </p>
                          <p className="mt-0.5 text-sm font-semibold leading-tight line-clamp-2">
                            {formData.title || "Título do banner"}
                          </p>
                          {formData.subtitle ? (
                            <p className="mt-0.5 text-[11px] text-white/80 line-clamp-1">
                              {formData.subtitle}
                            </p>
                          ) : null}
                          {formData.buttonText ? (
                            <span className="mt-2 inline-flex rounded-full bg-white px-2.5 py-0.5 text-[10px] font-semibold text-zinc-900">
                              {formData.buttonText}
                            </span>
                          ) : null}
                        </div>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-4 text-center"
                      >
                        <ImageIcon className="h-7 w-7 text-muted-foreground/50" />
                        <p className="text-xs font-medium text-foreground">
                          Arrasta uma imagem ou envia do PC
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          JPEG, PNG, WebP · máx. 10 MB
                        </p>
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Enviar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setPickerOpen(true)}
                    disabled={isLoading}
                  >
                    <FolderOpen className="h-3.5 w-3.5" />
                    Biblioteca
                  </Button>
                  {imagePreview && (!isEdit || selectedImage || formData.image !== banner?.image) ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs text-muted-foreground"
                      onClick={handleRemoveImage}
                      disabled={isLoading}
                    >
                      <X className="h-3.5 w-3.5" />
                      Remover
                    </Button>
                  ) : null}
                  {imageSourceLabel ? (
                    <span className="ml-auto max-w-45 truncate text-[11px] text-muted-foreground">
                      {selectedImage
                        ? `${imageSourceLabel} (${(selectedImage.size / 1024 / 1024).toFixed(2)} MB)`
                        : imageSourceLabel}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="banner-title" className="text-xs">
                    Título <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="banner-title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                    placeholder="Tecnologia que transforma o seu dia"
                    className="h-8 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="banner-subtitle" className="text-xs">
                    Subtítulo
                  </Label>
                  <Input
                    id="banner-subtitle"
                    value={formData.subtitle}
                    onChange={(e) =>
                      setFormData({ ...formData, subtitle: e.target.value })
                    }
                    placeholder="iPhone 17 Pro Max"
                    className="h-8 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="banner-description" className="text-xs">
                    Descrição
                  </Label>
                  <Textarea
                    id="banner-description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Headphones, smartwatches e muito mais."
                    className="min-h-18 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1.5">
                    <Label htmlFor="banner-link" className="text-xs">
                      Link
                    </Label>
                    <Input
                      id="banner-link"
                      type="url"
                      value={formData.link}
                      onChange={(e) =>
                        setFormData({ ...formData, link: e.target.value })
                      }
                      placeholder="https://…"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="banner-cta" className="text-xs">
                      Texto do botão
                    </Label>
                    <Input
                      id="banner-cta"
                      value={formData.buttonText}
                      onChange={(e) =>
                        setFormData({ ...formData, buttonText: e.target.value })
                      }
                      placeholder="Comprar agora"
                      className="h-8 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Posição</Label>
                    <Select
                      value={formData.position}
                      onValueChange={(value) =>
                        setFormData({ ...formData, position: value })
                      }
                    >
                      <SelectTrigger size="sm" className="w-full text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hero">Hero</SelectItem>
                        <SelectItem value="hero-side">Lateral</SelectItem>
                        <SelectItem value="promo">Promo</SelectItem>
                        <SelectItem value="sidebar">Sidebar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="banner-order" className="text-xs">
                      Ordem
                    </Label>
                    <Input
                      id="banner-order"
                      type="number"
                      min="0"
                      value={formData.orderIndex}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          orderIndex: parseInt(e.target.value) || 0,
                        })
                      }
                      className="h-8 text-sm tabular-nums"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Estado</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger size="sm" className="w-full text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Ativo</SelectItem>
                        <SelectItem value="INACTIVE">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Início</Label>
                    <DatePicker
                      date={formData.startDate}
                      onSelect={(date) =>
                        setFormData({ ...formData, startDate: date || undefined })
                      }
                      placeholder="Sem início"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Fim</Label>
                    <DatePicker
                      date={formData.endDate}
                      onSelect={(date) =>
                        setFormData({ ...formData, endDate: date || undefined })
                      }
                      placeholder="Sem fim"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" size="sm" className="h-8 text-xs" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {isEdit ? "A guardar…" : "A criar…"}
                  </>
                ) : isEdit ? (
                  "Guardar alterações"
                ) : (
                  "Criar banner"
                )}
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
        initialGroup="__all__"
        onSelect={applyFromLibrary}
        title="Escolher imagem da biblioteca"
        description="Usa uma imagem já enviada na biblioteca de media."
      />
    </>
  )
}
