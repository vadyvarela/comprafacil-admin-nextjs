"use client"

/* eslint-disable @next/next/no-img-element */

import { useState, useRef, useEffect } from "react"
import { FolderOpen, Upload, X, Image as ImageIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MediaPickerDialog } from "@/components/media/media-picker-dialog"
import { showToast } from "@/lib/utils/toast"
import { getErrorMessage } from "@/lib/utils/errors"
import { mediaGroupFromBrandSlug } from "@/lib/media/brand-group"

interface VariantImageUploadProps {
  value: string
  onChange: (imageUrl: string) => void
  disabled?: boolean
  /** Slug da marca do produto pai — pasta na biblioteca. */
  brandSlug?: string | null
}

type ImageUploadResponse = {
  url?: string
  imageUrl?: string
  error?: string
}

export function VariantImageUpload({
  value,
  onChange,
  disabled,
  brandSlug,
}: VariantImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(value || null)
  const [pickerOpen, setPickerOpen] = useState(false)

  useEffect(() => {
    setPreview(value || null)
  }, [value])

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      showToast.error("Formato inválido", "Por favor, selecione um arquivo de imagem")
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast.error("Arquivo muito grande", "A imagem deve ter no máximo 10MB")
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("image", file)
      formData.append("source", "VARIANT")
      formData.append("group", mediaGroupFromBrandSlug(brandSlug))

      const response = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as ImageUploadResponse
        throw new Error(errorData.error || "Erro ao fazer upload da imagem")
      }

      const data = (await response.json()) as ImageUploadResponse

      const imageUrl = data.url ?? data.imageUrl
      if (imageUrl) {
        setPreview(imageUrl)
        onChange(imageUrl)
        showToast.success("Imagem enviada", "A imagem foi carregada com sucesso")
      } else {
        throw new Error("URL da imagem não retornada")
      }
    } catch (error: unknown) {
      console.error("Error uploading image:", error)
      showToast.error(
        "Erro ao fazer upload",
        getErrorMessage(error, "Ocorreu um erro ao enviar a imagem"),
      )
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemove = () => {
    setPreview(null)
    onChange("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const applyFromLibrary = (urls: string[]) => {
    const url = urls[0]
    if (!url) return
    setPreview(url)
    onChange(url)
    showToast.success("Imagem seleccionada", "Imagem da biblioteca aplicada")
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {preview ? (
        <div className="relative group">
          <div className="relative w-10 h-10 rounded-md border border-input overflow-hidden bg-muted">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleRemove}
            disabled={uploading || disabled}
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : null}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleImageSelect}
        disabled={uploading || disabled}
        className="hidden"
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading || disabled}
        className="h-8 text-xs px-2"
        title="Upload do PC"
      >
        {uploading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <>
            <Upload className="h-3.5 w-3.5 mr-1" />
            PC
          </>
        )}
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setPickerOpen(true)}
        disabled={uploading || disabled}
        className="h-8 text-xs px-2"
        title="Escolher da biblioteca"
      >
        <FolderOpen className="h-3.5 w-3.5 mr-1" />
        Media
      </Button>

      {preview ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || disabled}
          className="h-8 text-xs px-2 text-muted-foreground"
        >
          <ImageIcon className="h-3 w-3 mr-1" />
          Alterar
        </Button>
      ) : null}

      <MediaPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        multiple={false}
        maxSelectable={1}
        brandSlug={brandSlug}
        onSelect={applyFromLibrary}
        title="Escolher imagem da biblioteca"
        description="Selecciona uma imagem existente para esta variante."
      />
    </div>
  )
}
