"use client"

import { useMemo } from "react"
import { useQuery } from "@apollo/client/react"
import { HOME_LAYOUT_RULES, type HomeBlock } from "@/lib/home-layout/schema"
import { GET_CATEGORY_LIST } from "@/lib/graphql/categories/queries"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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

const UUID_TOKEN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function parseProductIdsFromText(raw: string, max: number): string[] {
  const parts = raw.split(/[\s,;]+/).filter(Boolean)
  const out: string[] = []
  const seen = new Set<string>()
  for (const p of parts) {
    const t = p.trim()
    if (!UUID_TOKEN.test(t)) continue
    const k = t.toLowerCase()
    if (seen.has(k)) continue
    seen.add(k)
    out.push(t)
    if (out.length >= max) break
  }
  return out
}

type CategoryRailBlock = Extract<HomeBlock, { type: "categoryRail" }>

function CategoryRailHomeFields({
  block,
  onChange,
}: {
  block: CategoryRailBlock
  onChange: (next: HomeBlock) => void
}) {
  const { data, loading } = useQuery<{
    categoryList: { id: string; name: string; slug: string }[]
  }>(GET_CATEGORY_LIST, { fetchPolicy: "cache-and-network" })

  const list = useMemo(() => {
    return [...(data?.categoryList ?? [])].sort((a, b) =>
      a.name.localeCompare(b.name, "pt", { sensitivity: "base" })
    )
  }, [data?.categoryList])

  const derivedId =
    block.props.categoryId ??
    list.find((c) => c.slug === block.props.categorySlug)?.id ??
    ""

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <div className="space-y-1 sm:col-span-2">
        <Label className="text-[10px]">Categoria</Label>
        <Select
          value={derivedId || undefined}
          disabled={loading && list.length === 0}
          onValueChange={(id) => {
            const cat = list.find((c) => c.id === id)
            if (!cat) return
            onChange({
              ...block,
              props: {
                ...block.props,
                categoryId: cat.id,
                categorySlug: cat.slug,
                seeAllHref: `/categoria/${cat.slug}`,
              },
            })
          }}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder={loading ? "A carregar…" : "Escolhe uma categoria"} />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            {list.map((c) => (
              <SelectItem key={c.id} value={c.id} className="text-xs">
                <span className="truncate">{c.name}</span>
                <span className="text-muted-foreground ml-1 font-mono text-[10px]">{c.slug}</span>
              </SelectItem>
            ))}
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
          placeholder="/categoria/slug"
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
              onValueChange={(v) => {
                const variant = v as (typeof block.props)["variant"]
                onChange({
                  ...block,
                  props: {
                    ...block.props,
                    variant,
                    ...(variant === "curated"
                      ? { productIds: block.props.productIds?.length ? block.props.productIds : [] }
                      : { productIds: undefined }),
                  },
                })
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Novidades</SelectItem>
                <SelectItem value="featured">Destaques (metadata)</SelectItem>
                <SelectItem value="curated">Seleção manual (UUIDs)</SelectItem>
                <SelectItem value="bestsellers">Mais vendidos</SelectItem>
                <SelectItem value="on_sale">Em promoção</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {block.props.variant === "curated" ? (
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-[10px]">
                IDs de produto (UUID) — um por linha ou vírgulas · máx. {HOME_LAYOUT_RULES.railLimitMax}
              </Label>
              <Textarea
                className="min-h-[88px] font-mono text-[11px] leading-relaxed"
                placeholder="Cola os UUID da lista de produtos (coluna id)."
                value={(block.props.productIds ?? []).join("\n")}
                onChange={(e) => {
                  const productIds = parseProductIdsFromText(
                    e.target.value,
                    HOME_LAYOUT_RULES.railLimitMax
                  )
                  onChange({ ...block, props: { ...block.props, productIds } })
                }}
              />
            </div>
          ) : null}
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
      return <CategoryRailHomeFields block={block} onChange={onChange} />
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
