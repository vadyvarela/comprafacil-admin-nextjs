"use client"

import { ThemeColorField } from "@/components/settings/theme-color-field"
import { Label } from "@/components/ui/label"
import type { ThemeZoneOverrides, ZoneSurface } from "@/lib/theme-zones"

type SurfaceZoneKey = "header" | "footer" | "navigation" | "checkout" | "productCard"

type Props = {
  title: string
  description?: string
  zoneKey: SurfaceZoneKey
  zones: ThemeZoneOverrides
  onChange: (zones: ThemeZoneOverrides) => void
}

export function ThemeZoneSurfaceSection({ title, description, zoneKey, zones, onChange }: Props) {
  const zone = zones[zoneKey] ?? {}
  const custom = zone.custom === true

  function patch(partial: Partial<ZoneSurface>) {
    onChange({
      ...zones,
      [zoneKey]: { ...zone, ...partial },
    })
  }

  return (
    <div className="space-y-3 rounded-lg border border-border/60 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[13px] font-semibold">{title}</p>
          {description ? <p className="text-[11px] text-muted-foreground">{description}</p> : null}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <input
            id={`${zoneKey}-custom`}
            type="checkbox"
            checked={custom}
            onChange={(e) => patch({ custom: e.target.checked })}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          <Label htmlFor={`${zoneKey}-custom`} className="text-[11px] text-muted-foreground">
            Personalizar
          </Label>
        </div>
      </div>
      {custom ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <ThemeColorField id={`${zoneKey}-bg`} label="Fundo" value={zone.background ?? "#ffffff"} onChange={(v) => patch({ background: v })} />
          <ThemeColorField id={`${zoneKey}-fg`} label="Texto" value={zone.foreground ?? "#171717"} onChange={(v) => patch({ foreground: v })} />
          <ThemeColorField id={`${zoneKey}-muted`} label="Descrição" value={zone.muted ?? "#6b7280"} onChange={(v) => patch({ muted: v })} />
          <ThemeColorField id={`${zoneKey}-border`} label="Borda" value={zone.border ?? "#e5e7eb"} onChange={(v) => patch({ border: v })} />
          <ThemeColorField id={`${zoneKey}-primary`} label="Accent" value={zone.primary ?? "#2563eb"} onChange={(v) => patch({ primary: v })} />
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground">A usar cores do tema global.</p>
      )}
    </div>
  )
}
