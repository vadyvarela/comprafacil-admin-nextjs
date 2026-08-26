"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import {
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  ImageIcon,
  Loader2,
  MousePointer2,
  Star,
  Trash2,
  Upload,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { MediaPickerDialog } from "@/components/media/media-picker-dialog"
import { showToast } from "@/lib/utils/toast"
import { mediaGroupFromBrandSlug } from "@/lib/media/brand-group"

interface VariantGalleryUploadProps {
  images: string[]
  hoverImageUrl?: string | null
  onChange: (images: string[], hoverImageUrl?: string | null) => void
  disabled?: boolean
  brandSlug?: string | null
}

const MAX_IMAGES = 12
const MAX_SIZE = 10 * 1024 * 1024

export function VariantGalleryUpload({
  images,
  hoverImageUrl = null,
  onChange,
  disabled,
  brandSlug,
}: VariantGalleryUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [localImages, setLocalImages] = useState<string[]>(images)
  const [localHover, setLocalHover] = useState<string | null>(hoverImageUrl ?? null)
  const [uploading, setUploading] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  useEffect(() => {
    setLocalImages(images)
    setLocalHover(hoverImageUrl ?? null)
  }, [images, hoverImageUrl])

  const emitChange = useCallback(
    (nextImages: string[], nextHover?: string | null) => {
      onChange(nextImages, nextHover !== undefined ? nextHover : localHover)
    },
    [onChange, localHover],
  )

  const uploadFile = async (file: File): Promise<string> => {
    if (!file.type.startsWith("image/")) {
      throw new Error("Seleciona um ficheiro de imagem válido")
    }
    if (file.size > MAX_SIZE) {
      throw new Error("Imagem demasiado grande (máx. 10 MB)")
    }

    const formData = new FormData()
    formData.append("image", file)
    formData.append("source", "VARIANT")
    formData.append("group", mediaGroupFromBrandSlug(brandSlug))

    const res = await fetch("/api/upload/image", {
      method: "POST",
      body: formData,
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error((err as { error?: string }).error ?? "Erro no upload")
    }

    const data = (await res.json()) as { url?: string; imageUrl?: string }
    const url = data.url || data.imageUrl
    if (!url) throw new Error("URL da imagem não devolvida")
    return url
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length || disabled) return
    if (localImages.length >= MAX_IMAGES) {
      showToast.error("Limite atingido", `Máximo de ${MAX_IMAGES} imagens`)
      return
    }

    setUploading(true)
    const added: string[] = [...localImages]

    try {
      for (const file of Array.from(files)) {
        if (added.length >= MAX_IMAGES) break
        const url = await uploadFile(file)
        if (!added.includes(url)) added.push(url)
      }
      setLocalImages(added)
      emitChange(added)
    } catch (e: unknown) {
      showToast.error("Erro", e instanceof Error ? e.message : "Erro ao carregar imagens")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const removeAt = (index: number) => {
    if (disabled) return
    const removed = localImages[index]
    const next = localImages.filter((_, i) => i !== index)
    const nextHover = localHover === removed ? null : localHover
    setLocalImages(next)
    setLocalHover(nextHover)
    emitChange(next, nextHover)
  }

  const setAsCover = (index: number) => {
    if (disabled || index === 0) return
    const next = [...localImages]
    const [item] = next.splice(index, 1)
    next.unshift(item)
    setLocalImages(next)
    emitChange(next)
  }

  const move = (index: number, dir: -1 | 1) => {
    if (disabled) return
    const target = index + dir
    if (target < 0 || target >= localImages.length) return
    const next = [...localImages]
    ;[next[index], next[target]] = [next[target], next[index]]
    setLocalImages(next)
    emitChange(next)
  }

  const setAsHover = (index: number) => {
    if (disabled || index === 0) return
    const url = localImages[index]
    const nextHover = localHover === url ? null : url
    setLocalHover(nextHover)
    emitChange(localImages, nextHover)
  }

  const addFromLibrary = (urls: string[]) => {
    if (disabled || !urls.length) return
    const added = [...localImages]
    for (const url of urls) {
      if (added.length >= MAX_IMAGES) break
      if (!added.includes(url)) added.push(url)
    }
    if (added.length === localImages.length) {
      showToast.error("Nada a adicionar", "As imagens já estão na galeria")
      return
    }
    setLocalImages(added)
    emitChange(added)
  }

  const busy = uploading || disabled
  const canAdd = localImages.length < MAX_IMAGES

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">
            Galeria ({localImages.length}/{MAX_IMAGES})
          </span>
        </div>
        {uploading && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            A enviar…
          </span>
        )}
      </div>

      {localImages.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {localImages.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="relative group aspect-square rounded-md border border-input overflow-hidden bg-muted/30"
            >
              <Image
                src={url}
                alt={`Imagem ${index + 1}`}
                fill
                className="object-contain p-1"
                sizes="100px"
              />
              {index === 0 && (
                <span className="absolute top-1 left-1 flex items-center gap-0.5 rounded bg-blue-600 px-1 py-0.5 text-[9px] font-bold text-white">
                  <Star className="h-2.5 w-2.5 fill-current" />
                  Capa
                </span>
              )}
              {localHover === url && index !== 0 && (
                <span className="absolute top-1 right-1 flex items-center gap-0.5 rounded bg-violet-600 px-1 py-0.5 text-[9px] font-bold text-white">
                  <MousePointer2 className="h-2.5 w-2.5" />
                  Hover
                </span>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
                {index !== 0 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="h-6 text-[10px] px-1.5 w-full"
                    disabled={busy}
                    onClick={() => setAsCover(index)}
                  >
                    Capa
                  </Button>
                )}
                {index !== 0 && (
                  <Button
                    type="button"
                    size="sm"
                    variant={localHover === url ? "default" : "secondary"}
                    className="h-6 text-[10px] px-1.5 w-full"
                    disabled={busy}
                    onClick={() => setAsHover(index)}
                  >
                    {localHover === url ? "Remover hover" : "Hover"}
                  </Button>
                )}
                <div className="flex gap-0.5 w-full">
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="h-6 w-6 shrink-0"
                    disabled={busy || index === 0}
                    onClick={() => move(index, -1)}
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="h-6 w-6 shrink-0"
                    disabled={busy || index === localImages.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="h-6 w-6 shrink-0 ml-auto"
                    disabled={busy}
                    onClick={() => removeAt(index)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-input rounded-md px-3">
          <ImageIcon className="h-5 w-5 text-muted-foreground mb-1" />
          <p className="text-xs text-muted-foreground text-center">Adicionar fotos da variante</p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        disabled={busy}
        onChange={(e) => void handleFiles(e.target.files)}
      />

      {canAdd && (
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            disabled={busy}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                A enviar…
              </>
            ) : (
              <>
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                Do PC
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            disabled={busy}
            onClick={() => setPickerOpen(true)}
          >
            <FolderOpen className="mr-1.5 h-3.5 w-3.5" />
            Biblioteca
          </Button>
        </div>
      )}

      <MediaPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        multiple
        maxSelectable={MAX_IMAGES}
        brandSlug={brandSlug}
        excludeUrls={localImages}
        onSelect={addFromLibrary}
        title="Imagens da variante"
        description="Selecciona imagens da biblioteca para esta variante."
      />
    </div>
  )
}
