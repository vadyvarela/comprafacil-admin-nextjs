"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Copy, ExternalLink } from "lucide-react"
import { toast } from "sonner"

type MetaUrlFieldProps = {
  id: string
  label: string
  value: string
}

export function MetaUrlField({ id, label, value }: MetaUrlFieldProps) {
  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(value)
      toast.success("URL copiada")
    } catch {
      toast.error("Não foi possível copiar")
    }
  }

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="flex gap-2">
        <Input id={id} readOnly value={value} className="h-9 font-mono text-xs" />
        <Button type="button" variant="outline" size="icon-sm" onClick={copyUrl}>
          <Copy className="h-3.5 w-3.5" aria-hidden />
          <span className="sr-only">Copiar URL</span>
        </Button>
        <Button type="button" variant="outline" size="icon-sm" asChild>
          <a href={value} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            <span className="sr-only">Abrir URL</span>
          </a>
        </Button>
      </div>
    </div>
  )
}
