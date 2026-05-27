"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { ImageOff, Loader2, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

type StoreImageFieldProps = {
  id: string
  label: string
  hint?: string
  value: string
  onChange: (url: string) => void
  previewClassName?: string
}

export function StoreImageField({
  id,
  label,
  hint,
  value,
  onChange,
  previewClassName = "h-14 w-auto max-w-[200px] object-contain",
}: StoreImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [broken, setBroken] = useState(false)

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Formato inválido", { description: "Selecciona uma imagem." })
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ficheiro grande", { description: "Máximo 10 MB." })
      return
    }

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("image", file)
      fd.append("group", "store-brand")
      const res = await fetch("/api/upload/image", { method: "POST", body: fd })
      const data = (await res.json()) as { url?: string; imageUrl?: string; error?: string }
      if (!res.ok) throw new Error(data.error ?? "Upload falhou")
      const url = data.url ?? data.imageUrl ?? ""
      if (!url) throw new Error("URL não devolvida")
      onChange(url)
      setBroken(false)
      toast.success("Imagem carregada")
    } catch (e) {
      toast.error("Upload falhou", {
        description: e instanceof Error ? e.message : "Erro desconhecido",
      })
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
      <div className="flex flex-wrap items-center gap-3">
        {value && !broken ? (
          <div className="relative rounded-md border border-border/80 bg-muted/30 px-3 py-2">
            <Image
              src={value}
              alt=""
              width={200}
              height={56}
              unoptimized
              className={previewClassName}
              onError={() => setBroken(true)}
            />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white shadow"
              aria-label="Remover imagem"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="flex h-14 w-28 items-center justify-center rounded-md border border-dashed border-border bg-muted/20 text-muted-foreground">
            {broken ? <ImageOff className="h-5 w-5" /> : <Upload className="h-5 w-5 opacity-40" />}
          </div>
        )}
        <div className="flex gap-2">
          <input
            ref={inputRef}
            id={id}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void handleFile(f)
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
            Carregar
          </Button>
        </div>
      </div>
    </div>
  )
}
