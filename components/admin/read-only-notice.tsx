import { Eye, ShieldCheck } from "lucide-react"

import { cn } from "@/lib/utils"

type ReadOnlyNoticeProps = {
  moduleLabel?: string
  className?: string
}

export function ReadOnlyNotice({ moduleLabel, className }: ReadOnlyNoticeProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-border/80 bg-muted/25 p-3 text-xs text-muted-foreground shadow-xs sm:flex-row sm:items-start",
        className
      )}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/70 bg-background">
        <Eye className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-semibold text-foreground">
          {moduleLabel ? `${moduleLabel} em modo leitura` : "Modo leitura"}
        </p>
        <p className="leading-relaxed">
          Pode consultar informação, pesquisar e abrir detalhes. Para criar, editar, eliminar ou publicar, é preciso
          uma função com permissão de escrita.
        </p>
      </div>
      <span className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border border-border/70 bg-background px-2.5 text-[11px] font-medium text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5" />
        Acesso limitado
      </span>
    </div>
  )
}
