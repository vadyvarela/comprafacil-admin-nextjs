"use client"

import { ThemeColorField } from "@/components/settings/theme-color-field"
import { Label } from "@/components/ui/label"
import type { ThemeZoneOverrides } from "@/lib/theme-zones"

type Props = {
  zones: ThemeZoneOverrides
  onChange: (zones: ThemeZoneOverrides) => void
}

export function ThemeZonePromoSection({ zones, onChange }: Props) {
  const promo = zones.promo ?? {}
  const custom = promo.custom === true

  function patchPromo(partial: Partial<NonNullable<ThemeZoneOverrides["promo"]>>) {
    onChange({ ...zones, promo: { ...promo, ...partial } })
  }

  return (
    <div className="space-y-3 rounded-lg border border-border/60 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[13px] font-semibold">Promoções</p>
          <p className="text-[11px] text-muted-foreground">Gradiente dos cartões promocionais</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <input
            id="promo-custom"
            type="checkbox"
            checked={custom}
            onChange={(e) => patchPromo({ custom: e.target.checked })}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          <Label htmlFor="promo-custom" className="text-[11px] text-muted-foreground">
            Personalizar
          </Label>
        </div>
      </div>
      {custom ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <ThemeColorField id="promo-from" label="Início" value={promo.gradientFrom ?? "#0f172a"} onChange={(v) => patchPromo({ gradientFrom: v })} />
          <ThemeColorField id="promo-via" label="Meio" value={promo.gradientVia ?? "#1e3a8a"} onChange={(v) => patchPromo({ gradientVia: v })} />
          <ThemeColorField id="promo-to" label="Fim" value={promo.gradientTo ?? "#2563eb"} onChange={(v) => patchPromo({ gradientTo: v })} />
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground">Gradiente derivado da cor primária.</p>
      )}
    </div>
  )
}

export function ThemeZoneBadgeSection({ zones, onChange }: Props) {
  const badge = zones.badge ?? {}
  const custom = badge.custom === true

  function patchBadge(partial: Partial<NonNullable<ThemeZoneOverrides["badge"]>>) {
    onChange({ ...zones, badge: { ...badge, ...partial } })
  }

  return (
    <div className="space-y-3 rounded-lg border border-border/60 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[13px] font-semibold">Badges</p>
          <p className="text-[11px] text-muted-foreground">Etiquetas de promoção e stock</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <input
            id="badge-custom"
            type="checkbox"
            checked={custom}
            onChange={(e) => patchBadge({ custom: e.target.checked })}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          <Label htmlFor="badge-custom" className="text-[11px] text-muted-foreground">
            Personalizar
          </Label>
        </div>
      </div>
      {custom ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <ThemeColorField id="badge-sale" label="Promoção" value={badge.sale ?? "#ef4444"} onChange={(v) => patchBadge({ sale: v })} />
          <ThemeColorField id="badge-success" label="Stock" value={badge.success ?? "#16a34a"} onChange={(v) => patchBadge({ success: v })} />
          <ThemeColorField id="badge-warning" label="Aviso" value={badge.warning ?? "#f59e0b"} onChange={(v) => patchBadge({ warning: v })} />
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground">Cores padrão de sistema.</p>
      )}
    </div>
  )
}
