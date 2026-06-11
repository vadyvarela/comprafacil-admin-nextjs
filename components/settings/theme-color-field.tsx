"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Props = {
  id: string
  label: string
  hint?: string
  value: string
  onChange: (value: string) => void
}

export function ThemeColorField({ id, label, hint, value, onChange }: Props) {
  const safe = /^#[0-9A-Fa-f]{6}$/.test(value) ? value : "#000000"

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-[13px]">
        {label}
      </Label>
      <div className="flex items-center gap-2">
        <input
          id={`${id}-picker`}
          type="color"
          value={safe}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-10 shrink-0 cursor-pointer rounded border border-border bg-background p-0.5"
          aria-label={`${label} picker`}
        />
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#RRGGBB"
          className="h-9 font-mono text-[13px]"
          spellCheck={false}
        />
      </div>
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  )
}
