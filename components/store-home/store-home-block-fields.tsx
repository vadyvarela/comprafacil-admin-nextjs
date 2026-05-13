"use client"

import type { HomeBlock } from "@/lib/home-layout/schema"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface StoreHomeBlockFieldsProps {
  block: HomeBlock
  onChange: (next: HomeBlock) => void
}

export function StoreHomeBlockFields({ block, onChange }: StoreHomeBlockFieldsProps) {
  switch (block.type) {
    case "hero":
      return (
        <p className="text-[11px] text-muted-foreground">
          Banners geridos em <span className="font-medium text-foreground">Marketing → Banners</span> (posições hero / hero-side).
        </p>
      )
    case "productRail":
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-[10px]">Variante</Label>
            <Select
              value={block.props.variant}
              onValueChange={(v) =>
                onChange({
                  ...block,
                  props: {
                    ...block.props,
                    variant: v as typeof block.props.variant,
                  },
                })
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Novidades</SelectItem>
                <SelectItem value="featured">Destaques</SelectItem>
                <SelectItem value="bestsellers">Mais vendidos</SelectItem>
                <SelectItem value="on_sale">Em promoção</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px]">Limite</Label>
            <Input
              type="number"
              min={1}
              max={24}
              className="h-8 text-xs"
              value={block.props.limit}
              onChange={(e) =>
                onChange({
                  ...block,
                  props: { ...block.props, limit: Number(e.target.value) || 1 },
                })
              }
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-[10px]">Título</Label>
            <Input
              className="h-8 text-xs"
              value={block.props.title}
              onChange={(e) =>
                onChange({ ...block, props: { ...block.props, title: e.target.value } })
              }
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-[10px]">Subtítulo (opcional)</Label>
            <Input
              className="h-8 text-xs"
              value={block.props.subtitle ?? ""}
              onChange={(e) =>
                onChange({
                  ...block,
                  props: { ...block.props, subtitle: e.target.value || undefined },
                })
              }
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-[10px]">Ver todos — path (opcional)</Label>
            <Input
              className="h-8 text-xs font-mono"
              placeholder="/produtos?sort=newest"
              value={block.props.seeAllHref ?? ""}
              onChange={(e) =>
                onChange({
                  ...block,
                  props: { ...block.props, seeAllHref: e.target.value || undefined },
                })
              }
            />
          </div>
        </div>
      )
    case "categoryRail":
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-[10px]">Slug da categoria</Label>
            <Input
              className="h-8 text-xs font-mono"
              value={block.props.categorySlug}
              onChange={(e) =>
                onChange({
                  ...block,
                  props: { ...block.props, categorySlug: e.target.value },
                })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px]">Limite</Label>
            <Input
              type="number"
              min={1}
              max={24}
              className="h-8 text-xs"
              value={block.props.limit}
              onChange={(e) =>
                onChange({
                  ...block,
                  props: { ...block.props, limit: Number(e.target.value) || 1 },
                })
              }
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-[10px]">Título (opcional)</Label>
            <Input
              className="h-8 text-xs"
              value={block.props.title ?? ""}
              onChange={(e) =>
                onChange({
                  ...block,
                  props: { ...block.props, title: e.target.value || undefined },
                })
              }
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-[10px]">Ver todos — path (opcional)</Label>
            <Input
              className="h-8 text-xs font-mono"
              value={block.props.seeAllHref ?? ""}
              onChange={(e) =>
                onChange({
                  ...block,
                  props: { ...block.props, seeAllHref: e.target.value || undefined },
                })
              }
            />
          </div>
        </div>
      )
    case "multiCategoryRails": {
      const mode = block.props.slugs?.length ? "slugs" : "max"
      return (
        <div className="grid gap-2">
          <div className="space-y-1">
            <Label className="text-[10px]">Modo</Label>
            <Select
              value={mode}
              onValueChange={(v) => {
                if (v === "max") {
                  onChange({
                    ...block,
                    props: { maxSections: block.props.maxSections ?? 3 },
                  })
                } else {
                  onChange({
                    ...block,
                    props: { slugs: block.props.slugs?.length ? block.props.slugs : ["smartphones"] },
                  })
                }
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="max">Primeiras N categorias</SelectItem>
                <SelectItem value="slugs">Lista de slugs</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {mode === "max" ? (
            <div className="space-y-1">
              <Label className="text-[10px]">N.º de categorias</Label>
              <Input
                type="number"
                min={1}
                max={10}
                className="h-8 text-xs"
                value={block.props.maxSections ?? 3}
                onChange={(e) =>
                  onChange({
                    ...block,
                    props: { maxSections: Number(e.target.value) || 1 },
                  })
                }
              />
            </div>
          ) : (
            <div className="space-y-1">
              <Label className="text-[10px]">Slugs (vírgula)</Label>
              <Input
                className="h-8 text-xs font-mono"
                value={(block.props.slugs ?? []).join(", ")}
                onChange={(e) => {
                  const slugs = e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                  onChange({ ...block, props: { slugs: slugs.length ? slugs : ["smartphones"] } })
                }}
              />
            </div>
          )}
        </div>
      )
    }
    case "newsletter":
      return (
        <div className="grid gap-2">
          <div className="space-y-1">
            <Label className="text-[10px]">Título (opcional)</Label>
            <Input
              className="h-8 text-xs"
              value={block.props.title ?? ""}
              onChange={(e) =>
                onChange({
                  ...block,
                  props: { ...block.props, title: e.target.value || undefined },
                })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px]">Subtítulo (opcional)</Label>
            <Input
              className="h-8 text-xs"
              value={block.props.subtitle ?? ""}
              onChange={(e) =>
                onChange({
                  ...block,
                  props: { ...block.props, subtitle: e.target.value || undefined },
                })
              }
            />
          </div>
        </div>
      )
    case "recentlyViewed":
      return (
        <div className="space-y-1 max-w-[120px]">
          <Label className="text-[10px]">Limite</Label>
          <Input
            type="number"
            min={1}
            max={24}
            className="h-8 text-xs"
            value={block.props.limit}
            onChange={(e) =>
              onChange({
                ...block,
                props: { limit: Number(e.target.value) || 1 },
              })
            }
          />
        </div>
      )
    default:
      return null
  }
}
