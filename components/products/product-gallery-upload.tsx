"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import {
  ChevronLeft,
  ChevronRight,
  GripVertical,
  ImageIcon,
  Loader2,
  Star,
  Trash2,
  Upload,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { showToast } from "@/lib/utils/toast"
import { parseProductGalleryUrls } from "@/lib/products/product-gallery-metadata"

interface ProductGalleryUploadProps {
  productId: string
  primaryImage?: string | null
  metadata?: string | null
  onSaved?: () => void
}

const MAX_IMAGES = 12
const MAX_SIZE = 10 * 1024 * 1024

export function ProductGalleryUpload({
  productId,
  primaryImage,
  metadata,
  onSaved,
}: ProductGalleryUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setImages(parseProductGalleryUrls(primaryImage, metadata))
  }, [primaryImage, metadata])

  const persistGallery = useCallback(
    async (nextImages: string[]) => {
      setSaving(true)
      try {
        const res = await fetch(`/api/product/${productId}/gallery`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ images: nextImages }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(
            (err as { error?: string }).error ?? "Erro ao guardar galeria",
          )
        }
        const data = (await res.json()) as { images?: string[] }
        if (Array.isArray(data.images)) setImages(data.images)
        onSaved?.()
        return true
      } finally {
        setSaving(false)
      }
    },
    [productId, onSaved],
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
    formData.append("source", "PRODUCT")
    formData.append("group", "produtos")

    const res = await fetch("/api/upload/image", {
      method: "POST",
      body: formData,
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(
        (err as { error?: string }).error ?? "Erro no upload",
      )
    }

    const data = (await res.json()) as { url?: string; imageUrl?: string }
    const url = data.url || data.imageUrl
    if (!url) throw new Error("URL da imagem não devolvida")
    return url
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return
    if (images.length >= MAX_IMAGES) {
      showToast.error("Limite atingido", `Máximo de ${MAX_IMAGES} imagens`)
      return
    }

    setUploading(true)
    const added: string[] = [...images]

    try {
      for (const file of Array.from(files)) {
        if (added.length >= MAX_IMAGES) break
        const url = await uploadFile(file)
        if (!added.includes(url)) added.push(url)
      }

      setImages(added)
      await persistGallery(added)
      showToast.success(
        "Galeria atualizada",
        added.length === 1
          ? "1 imagem na galeria"
          : `${added.length} imagens na galeria`,
      )
    } catch (e: unknown) {
      showToast.error(
        "Erro",
        e instanceof Error ? e.message : "Erro ao carregar imagens",
      )
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const removeAt = async (index: number) => {
    const next = images.filter((_, i) => i !== index)
    setImages(next)
    try {
      await persistGallery(next)
      showToast.success("Imagem removida", "Galeria atualizada")
    } catch (e: unknown) {
      setImages(images)
      showToast.error(
        "Erro",
        e instanceof Error ? e.message : "Erro ao remover imagem",
      )
    }
  }

  const setAsCover = async (index: number) => {
    if (index === 0) return
    const next = [...images]
    const [item] = next.splice(index, 1)
    next.unshift(item)
    setImages(next)
    try {
      await persistGallery(next)
      showToast.success("Capa definida", "A primeira imagem é a capa na loja")
    } catch (e: unknown) {
      setImages(images)
      showToast.error("Erro", e instanceof Error ? e.message : "Erro ao reordenar")
    }
  }

  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= images.length) return
    const next = [...images]
    ;[next[index], next[target]] = [next[target], next[index]]
    setImages(next)
    try {
      await persistGallery(next)
    } catch {
      setImages(images)
      showToast.error("Erro", "Não foi possível reordenar")
    }
  }

  const busy = uploading || saving

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">
            Galeria ({images.length}/{MAX_IMAGES})
          </span>
        </div>
        {busy && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            A guardar…
          </span>
        )}
      </div>

      {images.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {images.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="relative group aspect-square rounded-md border border-input overflow-hidden bg-muted/30"
            >
              <Image
                src={url}
                alt={`Imagem ${index + 1}`}
                fill
                className="object-contain p-1"
                sizes="120px"
              />
              {index === 0 && (
                <span className="absolute top-1 left-1 flex items-center gap-0.5 rounded bg-blue-600 px-1 py-0.5 text-[9px] font-bold text-white">
                  <Star className="h-2.5 w-2.5 fill-current" />
                  Capa
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
                    onClick={() => void setAsCover(index)}
                  >
                    Capa
                  </Button>
                )}
                <div className="flex gap-0.5 w-full">
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="h-6 w-6 shrink-0"
                    disabled={busy || index === 0}
                    onClick={() => void move(index, -1)}
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="h-6 w-6 shrink-0"
                    disabled={busy || index === images.length - 1}
                    onClick={() => void move(index, 1)}
                  >
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="h-6 w-6 shrink-0 ml-auto"
                    disabled={busy}
                    onClick={() => void removeAt(index)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <GripVertical className="absolute bottom-1 right-1 h-3 w-3 text-white/60 opacity-0 group-hover:opacity-100" />
            </div>
          ))}
        </div>
      ) : (
        <div
          onClick={() => !busy && fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-input rounded-md cursor-pointer hover:bg-accent/50 transition-colors"
        >
          <Upload className="h-5 w-5 text-muted-foreground mb-1.5" />
          <p className="text-xs text-muted-foreground">Adicionar imagens à galeria</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            PNG, JPG, WEBP — até {MAX_IMAGES} imagens
          </p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        disabled={busy}
        onChange={(e) => void handleFiles(e.target.files)}
      />

      {images.length > 0 && images.length < MAX_IMAGES && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full h-8 text-xs"
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
              Adicionar imagens
            </>
          )}
        </Button>
      )}

      <p className="text-[10px] text-muted-foreground leading-snug">
        A primeira imagem é a capa na loja. As restantes aparecem na galeria do produto.
      </p>
    </div>
  )
}
