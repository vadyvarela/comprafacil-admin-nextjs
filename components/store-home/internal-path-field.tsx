"use client"

import { useMemo } from "react"
import { INTERNAL_PATH_PRESETS, isAllowedInternalHref } from "@/lib/home-layout/internal-href"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

const CUSTOM = "__custom__"
const NONE = "__none__"

export interface InternalPathFieldProps {
  label: string
  value: string | undefined
  onChange: (next: string | undefined) => void
  /** Se true, permite limpar o path (ex.: seeAllHref opcional). */
  allowEmpty?: boolean
  placeholder?: string
  className?: string
}

export function InternalPathField({
  label,
  value,
  onChange,
  allowEmpty = false,
  placeholder,
  className,
}: InternalPathFieldProps) {
  const presetHrefSet = useMemo(() => new Set(INTERNAL_PATH_PRESETS.map((p) => p.href)), [])
  const trimmed = value?.trim() ?? ""

  const selectValue = useMemo(() => {
    if (!trimmed) return allowEmpty ? NONE : CUSTOM
    if (presetHrefSet.has(trimmed)) return trimmed
    return CUSTOM
  }, [trimmed, allowEmpty, presetHrefSet])

  return (
    <div className={cn("space-y-1", className)}>
      <Label className="text-[10px]">{label}</Label>
      <Select
        value={selectValue}
        onValueChange={(v) => {
          if (v === NONE) {
            onChange(undefined)
            return
          }
          if (v === CUSTOM) {
            return
          }
          onChange(v)
        }}
      >
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder="Atalho ou path" />
        </SelectTrigger>
        <SelectContent>
          {allowEmpty ? (
            <SelectItem value={NONE} className="text-xs">
              (sem link)
            </SelectItem>
          ) : null}
          {INTERNAL_PATH_PRESETS.map((p) => (
            <SelectItem key={p.href} value={p.href} className="text-xs">
              <span>{p.label}</span>{" "}
              <span className="font-mono text-muted-foreground">{p.href}</span>
            </SelectItem>
          ))}
          <SelectItem value={CUSTOM} className="text-xs">
            Editar path manualmente…
          </SelectItem>
        </SelectContent>
      </Select>
      <Input
        className={cn(
          "h-8 text-xs font-mono",
          trimmed && !isAllowedInternalHref(trimmed) ? "border-destructive/60 focus-visible:ring-destructive/30" : ""
        )}
        placeholder={placeholder ?? "/produtos ou /categoria/slug"}
        value={trimmed}
        onChange={(e) => {
          const v = e.target.value.trim()
          onChange(v ? v : allowEmpty ? undefined : "")
        }}
      />
      {trimmed && !isAllowedInternalHref(trimmed) ? (
        <p className="text-[10px] text-destructive leading-snug">
          Path não permitido: o primeiro segmento tem de ser um dos permitidos (produtos, categoria, ofertas,
          busca, perfil, auth, …).
        </p>
      ) : null}
    </div>
  )
}
