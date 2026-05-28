"use client"

/* eslint-disable @next/next/no-img-element */

import { useState, useRef, useEffect } from "react"
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { showToast } from "@/lib/utils/toast"
import { getErrorMessage } from "@/lib/utils/errors"

interface VariantImageUploadProps {
  value: string
  onChange: (imageUrl: string) => void
  disabled?: boolean
}

type ImageUploadResponse = {
  url?: string
  imageUrl?: string
  error?: string
}

export function VariantImageUpload({ value, onChange, disabled }: VariantImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(value || null)

  useEffect(() => {
    setPreview(value || null)
  }, [value])

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    if (!file.type.startsWith("image/")) {
      showToast.error("Formato inválido", "Por favor, selecione um arquivo de imagem")
      return
    }

    // Validar tamanho (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showToast.error("Arquivo muito grande", "A imagem deve ter no máximo 10MB")
      return
    }

    setUploading(true)

    try {
      // Criar FormData
      const formData = new FormData()
      formData.append("image", file)
      formData.append("source", "VARIANT")
      formData.append("group", "variantes")

      // Fazer upload via API
      const response = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as ImageUploadResponse
        throw new Error(errorData.error || "Erro ao fazer upload da imagem")
      }

      const data = await response.json() as ImageUploadResponse
      
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
      showToast.error("Erro ao fazer upload", getErrorMessage(error, "Ocorreu um erro ao enviar a imagem"))
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

  return (
    <div className="flex items-center gap-2">
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
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || disabled}
          className="h-8 w-12 p-0 flex flex-col items-center justify-center"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Upload className="h-4 w-4 mb-1" />
            </>
          )}
        </Button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        disabled={uploading || disabled}
        className="hidden"
      />

      {preview && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || disabled}
          className="h-8 text-xs"
        >
          {uploading ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <ImageIcon className="h-3 w-3 mr-1" />
              Alterar
            </>
          )}
        </Button>
      )}
    </div>
  )
}

