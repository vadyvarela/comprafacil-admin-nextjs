"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

type LoadErrorProps = {
  title?: string
  message: string
}

/** Erro de carregamento de uma lista, com nova tentativa no servidor. */
export function LoadError({ title = "Erro ao carregar", message }: LoadErrorProps) {
  const router = useRouter()

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs"
    >
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-destructive">{title}</p>
        <p className="mt-0.5 text-muted-foreground">{message}</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="h-7 shrink-0 text-xs"
        onClick={() => router.refresh()}
      >
        Tentar novamente
      </Button>
    </div>
  )
}
