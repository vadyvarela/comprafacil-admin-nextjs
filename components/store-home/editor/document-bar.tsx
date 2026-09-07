"use client"

import { Loader2, Redo2, Undo2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  TooltipContent,
  TooltipRoot,
  TooltipTrigger,
} from "@/components/ui/tooltip"

/**
 * Estado do documento e as acções que o fazem avançar.
 *
 * Uma só acção primária — Publicar. Tudo o resto é secundário e assim se
 * apresenta: a barra antiga punha um checkbox de preferência do browser ao lado
 * do botão que altera a loja pública.
 */

type DocumentBarProps = {
  dirty: boolean
  savingDraft: boolean
  publishing: boolean
  lastAutosaveAt: string | null
  publishedAt: string | null
  blocksWithErrors: number
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onDiscard: () => void
  onPublish: () => void
}

export function DocumentBar({
  dirty,
  savingDraft,
  publishing,
  lastAutosaveAt,
  publishedAt,
  blocksWithErrors,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onDiscard,
  onPublish,
}: DocumentBarProps) {
  const blocked = blocksWithErrors > 0

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border/70 bg-background px-4 py-2.5">
      <div className="flex min-w-0 items-center gap-2">
        <StatusPill dirty={dirty} saving={savingDraft} />
        <p className="truncate text-[13px] text-muted-foreground">
          {savingDraft
            ? "A guardar rascunho…"
            : dirty
              ? "Alterações por guardar"
              : lastAutosaveAt
                ? `Rascunho guardado às ${lastAutosaveAt}`
                : publishedAt
                  ? `Publicado em ${publishedAt}`
                  : "Sem alterações"}
        </p>
      </div>

      <div className="flex items-center gap-1">
        <IconAction
          label="Desfazer (Ctrl+Z)"
          disabled={!canUndo}
          onClick={onUndo}
        >
          <Undo2 className="size-4" />
        </IconAction>
        <IconAction
          label="Refazer (Ctrl+Shift+Z)"
          disabled={!canRedo}
          onClick={onRedo}
        >
          <Redo2 className="size-4" />
        </IconAction>

        <span aria-hidden className="mx-1 h-5 w-px bg-border" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-[13px]"
          disabled={!dirty || savingDraft}
          onClick={onDiscard}
        >
          Descartar
        </Button>

        <TooltipRoot>
          <TooltipTrigger asChild>
            <span>
              <Button
                type="button"
                size="sm"
                className="gap-1.5 text-[13px]"
                disabled={publishing || blocked}
                onClick={onPublish}
              >
                {publishing ? <Loader2 className="size-3.5 animate-spin" /> : null}
                Publicar
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {blocked
              ? `Corrige ${blocksWithErrors} ${blocksWithErrors === 1 ? "secção" : "secções"} com erros antes de publicar`
              : "Põe o layout actual na loja pública"}
          </TooltipContent>
        </TooltipRoot>
      </div>
    </div>
  )
}

function StatusPill({ dirty, saving }: { dirty: boolean; saving: boolean }) {
  const tone = saving
    ? "bg-amber-500"
    : dirty
      ? "bg-amber-500"
      : "bg-emerald-500"
  return (
    <span
      aria-hidden
      className={`size-1.5 shrink-0 rounded-full ${tone}`}
    />
  )
}

function IconAction({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <TooltipRoot>
      <TooltipTrigger asChild>
        <span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
          >
            {children}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </TooltipRoot>
  )
}
