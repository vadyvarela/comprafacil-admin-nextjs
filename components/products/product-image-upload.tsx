"use client"

import { useState, useRef, useEffect } from "react"
import { Image, X, Upload, Loader2, ImageOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { showToast } from "@/lib/utils/toast"

interface ProductImageUploadProps {
  productId: string
  currentImage?: string | null
}

export function ProductImageUpload({ productId, currentImage }: ProductImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    // Mostrar imagem atual se existir
    if (currentImage && !selectedImage) {
      setImagePreview(currentImage)
      setImageError(false)
    }
  }, [currentImage, selectedImage])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
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

      setSelectedImage(file)
      
      // Criar preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
        setImageError(false)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    setImagePreview(currentImage || null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleUpload = async () => {
    if (!selectedImage) {
      showToast.error("Nenhuma imagem selecionada", "Por favor, selecione uma imagem antes de fazer upload")
      return
    }

    setUploading(true)

    try {
      const imageFormData = new FormData()
      imageFormData.append("image", selectedImage)
      
      const imageResponse = await fetch(`/api/product/${productId}/image`, {
        method: "PUT",
        body: imageFormData,
      })

      if (!imageResponse.ok) {
        const errorData = await imageResponse.json().catch(() => ({}))
        throw new Error(errorData.error || "Erro ao atualizar imagem")
      }

      const data = await imageResponse.json()
      
      // Atualizar preview com a nova URL da imagem
      if (data.data?.image) {
        setImagePreview(data.data.image)
        setImageError(false)
      }

      setSelectedImage(null)
      showToast.success("Imagem atualizada", "A imagem do produto foi atualizada com sucesso")
      
      // Resetar input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      // Recarregar a página para atualizar os dados
      window.location.reload()
    } catch (error: any) {
      console.error("Error uploading image:", error)
      showToast.error("Erro ao atualizar imagem", error.message || "Ocorreu um erro ao atualizar a imagem")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Image className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Imagem do Produto</span>
        </div>
        {selectedImage && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemoveImage}
            disabled={uploading}
            className="h-6 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Cancelar
          </Button>
        )}
      </div>

      {imagePreview ? (
        <div className="relative group">
          <div className="relative w-full aspect-4/3 rounded-lg border border-input overflow-hidden bg-muted/40">
            {!imageError ? (
              <img
                src={imagePreview}
                alt="Preview"
                className="h-full w-full object-contain p-2"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                <ImageOff className="h-6 w-6" />
                <p className="text-xs">Não foi possível carregar a imagem</p>
              </div>
            )}
            {selectedImage && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-xs text-white font-medium">Nova imagem selecionada</span>
              </div>
            )}
            {!selectedImage && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="bg-white/90 hover:bg-white"
                >
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  Alterar Imagem
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-input rounded-md cursor-pointer hover:bg-accent transition-colors"
        >
          <Upload className="h-6 w-6 text-muted-foreground mb-2" />
          <p className="text-xs text-muted-foreground text-center px-4">
            Clique para selecionar uma imagem
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            PNG, JPG, WEBP até 10MB
          </p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        disabled={uploading}
        className="hidden"
      />

      {selectedImage && (
        <Button
          onClick={handleUpload}
          disabled={uploading}
          size="sm"
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-3.5 w-3.5" />
              Atualizar Imagem
            </>
          )}
        </Button>
      )}

      {!selectedImage && imagePreview && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full"
        >
          <Upload className="mr-2 h-3.5 w-3.5" />
          Alterar Imagem
        </Button>
      )}
    </div>
  )
}

