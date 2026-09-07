/**
 * Peças partilhadas pelos editores de bloco.
 *
 * Vinham do topo de um ficheiro de 1901 linhas com um switch de 14 casos. Cada
 * tipo tem agora o seu módulo em `./<tipo>.tsx`; o que serve vários vive aqui,
 * incluindo os primitivos de UI, para os editores terem uma só origem.
 */
"use client"

import { useMemo } from "react"
import { useQuery } from "@apollo/client/react"
import { HOME_LAYOUT_RULES, type HomeBlock } from "@/lib/home-layout/schema"
import { GET_CATEGORY_LIST } from "@/lib/graphql/categories/queries"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { CuratedProductPicker } from "@/components/store-home/curated-product-picker"
import { InternalPathField } from "@/components/store-home/internal-path-field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  isWeeklyDealHref,
  WEEKLY_DEAL_GLOW_OPTIONS,
} from "@/lib/home-layout/weekly-deal-theme"


export type BlockFieldsProps<T> = {
  block: T
  onChange: (next: HomeBlock) => void
}

export {
  Label,
  Input,
  Button,
  Textarea,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  CuratedProductPicker,
  InternalPathField,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
  isWeeklyDealHref,
  WEEKLY_DEAL_GLOW_OPTIONS,
  HOME_LAYOUT_RULES,
  GET_CATEGORY_LIST,
  useQuery,
}
export type { HomeBlock }

export const UUID_TOKEN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function parseProductIdsFromText(raw: string, max: number): string[] {
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

export const PRODUCT_RAIL_VARIANT_HELP: Record<string, string> = {
  newest: "Mostra os produtos mais recentes do gateway (sem escolha manual).",
  featured: "Só produtos marcados como destaque no metadata do produto no gateway.",
  curated: "Escolhes produtos no picker; a ordem na lista é a ordem na loja.",
  bestsellers: "Ordenação por vendas no gateway (quando o campo existe).",
  on_sale: "Produtos em promoção (desconto ou preço original vs. actual).",
}

export const PROMO_GRADIENT_OPTIONS = [
  { value: "blue", label: "Azul / índigo" },
  { value: "purple", label: "Roxo / magenta" },
  { value: "orange", label: "Laranja / âmbar" },
  { value: "green", label: "Verde / teal" },
  { value: "slate", label: "Cinzento ardósia" },
  { value: "rose", label: "Rosa" },
] as const

export type PromoDuoBlock = Extract<HomeBlock, { type: "promoDuo" }>
export type PromoDuoCell = PromoDuoBlock["props"]["items"][number]
export type ShoeStoreHeroBlock = Extract<HomeBlock, { type: "shoeStoreHero" }>
export type ShoeStoreHeroSlide = ShoeStoreHeroBlock["props"]["slides"][number]
export type ShoeStoreExploreBlock = Extract<HomeBlock, { type: "shoeStoreExplore" }>
export type ShoeStoreExploreTile = ShoeStoreExploreBlock["props"]["tiles"][number]

export function PromoDuoCellFields({
  legend,
  cell,
  onChange,
}: {
  legend: string
  cell: PromoDuoCell
  onChange: (next: PromoDuoCell) => void
}) {
  return (
    <fieldset className="grid gap-2 rounded-md border border-border/60 bg-muted/10 p-2 sm:grid-cols-2">
      <legend className="mb-1 px-1 text-[10px] font-semibold text-foreground">{legend}</legend>
      <div className="space-y-1 sm:col-span-2">
        <Label className="text-[10px]">Título</Label>
        <Input className="h-8 text-xs" value={cell.title} onChange={(e) => onChange({ ...cell, title: e.target.value })} />
      </div>
      <div className="space-y-1 sm:col-span-2">
        <Label className="text-[10px]">Subtítulo (opcional)</Label>
        <Input
          className="h-8 text-xs"
          value={cell.subtitle ?? ""}
          onChange={(e) => onChange({ ...cell, subtitle: e.target.value || undefined })}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-[10px]">Texto do botão / link</Label>
        <Input
          className="h-8 text-xs"
          value={cell.ctaLabel}
          onChange={(e) => onChange({ ...cell, ctaLabel: e.target.value })}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-[10px]">Gradiente</Label>
        <Select value={cell.gradient} onValueChange={(v) => onChange({ ...cell, gradient: v as PromoDuoCell["gradient"] })}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PROMO_GRADIENT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value} className="text-xs">
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <InternalPathField
        className="sm:col-span-2"
        label="Destino (path interno)"
        value={cell.href}
        allowEmpty={false}
        placeholder="/ofertas"
        onChange={(href) => onChange({ ...cell, href: href?.trim() ? href : "/produtos" })}
      />
      <div className="space-y-1 sm:col-span-2">
        <Label className="text-[10px]">Imagem (opcional) — URL https ou /path</Label>
        <Input
          className="h-8 text-xs font-mono"
          placeholder="https://… ou /imagem.png"
          value={cell.imageUrl ?? ""}
          onChange={(e) => onChange({ ...cell, imageUrl: e.target.value || undefined })}
        />
      </div>
    </fieldset>
  )
}

type CategoryRailBlock = Extract<HomeBlock, { type: "categoryRail" }>

export function CategoryRailHomeFields({
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
        <p className="text-[10px] text-muted-foreground tabular-nums">
          {block.props.limit} / {HOME_LAYOUT_RULES.railLimitMax} produtos
        </p>
      </div>
      <div className="space-y-1 sm:col-span-2">
        <Label className="flex items-center justify-between gap-2 text-[10px]">
          <span>Título (opcional)</span>
          <span className="font-normal text-muted-foreground tabular-nums">
            {(block.props.title ?? "").length}/{HOME_LAYOUT_RULES.titleMax}
          </span>
        </Label>
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
        <Label className="flex items-center justify-between gap-2 text-[10px]">
          <span>Subtítulo (opcional)</span>
          <span className="font-normal text-muted-foreground tabular-nums">
            {(block.props.subtitle ?? "").length}/{HOME_LAYOUT_RULES.subtitleMax}
          </span>
        </Label>
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
      <InternalPathField
        className="sm:col-span-2"
        label="Ver todos — path (opcional)"
        value={block.props.seeAllHref}
        allowEmpty
        placeholder="/categoria/slug"
        onChange={(seeAllHref) => onChange({ ...block, props: { ...block.props, seeAllHref } })}
      />
    </div>
  )
}

export function toDatetimeLocalValue(iso: string): string {
  const ms = new Date(iso).getTime()
  if (!Number.isFinite(ms)) return ""
  const d = new Date(ms)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

type ShopByCategoryBlock = Extract<HomeBlock, { type: "shopByCategory" }>

export function ShopByCategoryHomeFields({
  block,
  onChange,
}: {
  block: ShopByCategoryBlock
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

  const items = block.props.items
  const patchItems = (next: typeof items) =>
    onChange({ ...block, props: { ...block.props, items: next } })
  const updateItem = (index: number, patch: Partial<(typeof items)[0]>) => {
    patchItems(items.map((it, i) => (i === index ? { ...it, ...patch } : it)))
  }

  return (
    <div className="grid gap-3">
      <div className="space-y-1">
        <Label className="text-[10px]">Título da secção</Label>
        <Input
          className="h-8 text-xs"
          value={block.props.title}
          onChange={(e) =>
            onChange({ ...block, props: { ...block.props, title: e.target.value } })
          }
        />
      </div>
      <p className="text-[10px] text-muted-foreground leading-snug">
        Entre 2 e 8 categorias. Imagem opcional sobrescreve a do GTW.
      </p>
      <div className="flex flex-col gap-3">
        {items.map((it, idx) => {
          const derivedId =
            it.categoryId ?? list.find((c) => c.slug === it.categorySlug)?.id ?? ""
          return (
            <div
              key={idx}
              className="grid gap-2 rounded-md border border-border/60 bg-muted/10 p-2 sm:grid-cols-2"
            >
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-[10px]">Categoria</Label>
                <Select
                  value={derivedId || undefined}
                  disabled={loading && list.length === 0}
                  onValueChange={(id) => {
                    const cat = list.find((c) => c.id === id)
                    if (!cat) return
                    updateItem(idx, {
                      categoryId: cat.id,
                      categorySlug: cat.slug,
                      title: it.title || cat.name,
                      href: `/categoria/${cat.slug}`,
                    })
                  }}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder={loading ? "A carregar…" : "Escolhe"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {list.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        <span className="truncate">{c.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-[10px]">Título no cartão (opcional)</Label>
                <Input
                  className="h-8 text-xs"
                  value={it.title ?? ""}
                  onChange={(e) => updateItem(idx, { title: e.target.value || undefined })}
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-[10px]">Imagem (opcional) — URL ou /path</Label>
                <Input
                  className="h-8 text-xs font-mono"
                  value={it.imageUrl ?? ""}
                  onChange={(e) => updateItem(idx, { imageUrl: e.target.value || undefined })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">CTA</Label>
                <Input
                  className="h-8 text-xs"
                  value={it.ctaLabel ?? "Ver produtos"}
                  onChange={(e) => updateItem(idx, { ctaLabel: e.target.value || undefined })}
                />
              </div>
              <div className="flex items-end justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[10px]"
                  disabled={items.length <= 2}
                  onClick={() => patchItems(items.filter((_, i) => i !== idx))}
                >
                  Remover
                </Button>
              </div>
            </div>
          )
        })}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 text-xs"
        disabled={items.length >= 8}
        onClick={() =>
          patchItems([
            ...items,
            { categorySlug: "smartphones", title: "Nova categoria", ctaLabel: "Ver produtos" },
          ])
        }
      >
        Adicionar categoria
      </Button>
    </div>
  )
}

