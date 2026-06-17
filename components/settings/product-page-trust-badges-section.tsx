"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DEFAULT_PRODUCT_PAGE_TRUST_BADGES,
  TRUST_BADGE_ICON_OPTIONS,
  type ProductPageTrustBadge,
  type ProductPageTrustBadges,
} from "@/lib/product-page-trust-badges"

type BadgeKey = keyof ProductPageTrustBadges

const BADGE_LABELS: Record<BadgeKey, { title: string; hint: string }> = {
  delivery: {
    title: "Entrega",
    hint: "Aparece na página de produto, junto aos botões de compra.",
  },
  warranty: {
    title: "Garantia",
    hint: "Segundo destaque informativo na ficha do produto.",
  },
}

type Props = {
  badges: ProductPageTrustBadges
  onChange: (badges: ProductPageTrustBadges) => void
}

function BadgeEditor({
  badgeKey,
  badge,
  onPatch,
}: {
  badgeKey: BadgeKey
  badge: ProductPageTrustBadge
  onPatch: (patch: Partial<ProductPageTrustBadge>) => void
}) {
  const meta = BADGE_LABELS[badgeKey]

  return (
    <div className="space-y-3 rounded-md border border-border/60 bg-muted/10 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[13px] font-semibold">{meta.title}</p>
          <p className="text-[10px] text-muted-foreground leading-snug">{meta.hint}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <input
            id={`${badgeKey}-enabled`}
            type="checkbox"
            checked={badge.enabled}
            onChange={(e) => onPatch({ enabled: e.target.checked })}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          <Label htmlFor={`${badgeKey}-enabled`} className="text-[11px] text-muted-foreground">
            Mostrar
          </Label>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-[10px]">Ícone</Label>
          <Select value={badge.icon} onValueChange={(v) => onPatch({ icon: v as ProductPageTrustBadge["icon"] })}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRUST_BADGE_ICON_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-[10px]">Título</Label>
          <Input
            className="h-8 text-xs"
            value={badge.title}
            onChange={(e) => onPatch({ title: e.target.value })}
            placeholder={DEFAULT_PRODUCT_PAGE_TRUST_BADGES[badgeKey].title}
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-[10px]">Subtítulo (opcional)</Label>
          <Input
            className="h-8 text-xs"
            value={badge.subtitle ?? ""}
            onChange={(e) => onPatch({ subtitle: e.target.value })}
            placeholder={DEFAULT_PRODUCT_PAGE_TRUST_BADGES[badgeKey].subtitle ?? ""}
          />
        </div>
      </div>
    </div>
  )
}

export function ProductPageTrustBadgesSection({ badges, onChange }: Props) {
  function patchBadge(key: BadgeKey, patch: Partial<ProductPageTrustBadge>) {
    onChange({
      ...badges,
      [key]: { ...badges[key], ...patch },
    })
  }

  return (
    <div className="space-y-3">
      {(Object.keys(BADGE_LABELS) as BadgeKey[]).map((key) => (
        <BadgeEditor
          key={key}
          badgeKey={key}
          badge={badges[key]}
          onPatch={(patch) => patchBadge(key, patch)}
        />
      ))}
    </div>
  )
}
