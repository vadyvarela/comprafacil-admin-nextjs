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

      {zoneKey === "productCard" ? (
        <>
          <div className="space-y-2 rounded-md border border-border/60 bg-muted/10 px-3 py-2.5">
            <Label htmlFor={`${zoneKey}-grid-cols`} className="text-[12px] font-semibold">
              Colunas da grelha (desktop)
            </Label>
            <select
              id={`${zoneKey}-grid-cols`}
              value={zone.gridColumns ?? 4}
              onChange={(e) => patch({ gridColumns: Number(e.target.value) })}
              className="h-9 w-full max-w-[12rem] rounded-md border border-border bg-background px-2 text-sm"
            >
              {[2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n} colunas
                </option>
              ))}
            </select>
            <p className="text-[10px] text-muted-foreground leading-snug">
              Aplica-se à home, categorias, busca e listagem de produtos. No telemóvel mantém 2 colunas.
            </p>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-md border border-primary/25 bg-primary/5 px-3 py-2.5">
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-foreground">Imagem alternativa no hover</p>
            <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">
              Troca a imagem do card ao passar o rato. Define a imagem de hover na galeria de cada produto.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <input
              id={`${zoneKey}-hover-swap`}
              type="checkbox"
              checked={zone.hoverImageSwap === true}
              onChange={(e) => patch({ hoverImageSwap: e.target.checked })}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            <Label htmlFor={`${zoneKey}-hover-swap`} className="text-[11px] font-medium text-foreground">
              Activar
            </Label>
          </div>
          </div>
        </>
      ) : null}

      {custom ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <ThemeColorField id={`${zoneKey}-bg`} label={zoneKey === "productCard" ? "Fundo (info)" : "Fundo"} value={zone.background ?? "#ffffff"} onChange={(v) => patch({ background: v })} />
          {zoneKey === "productCard" ? (
            <ThemeColorField
              id={`${zoneKey}-image-bg`}
              label="Fundo da imagem"
              value={zone.imageBackground ?? "#efefef"}
              onChange={(v) => patch({ imageBackground: v })}
            />
          ) : null}
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
