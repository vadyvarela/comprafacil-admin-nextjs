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

const PRODUCT_RAIL_VARIANT_HELP: Record<string, string> = {
  newest: "Mostra os produtos mais recentes do gateway (sem escolha manual).",
  featured: "Só produtos marcados como destaque no metadata do produto no gateway.",
  curated: "Escolhes produtos no picker; a ordem na lista é a ordem na loja.",
  bestsellers: "Ordenação por vendas no gateway (quando o campo existe).",
  on_sale: "Produtos em promoção (desconto ou preço original vs. actual).",
}

const PROMO_GRADIENT_OPTIONS = [
  { value: "blue", label: "Azul / índigo" },
  { value: "purple", label: "Roxo / magenta" },
  { value: "orange", label: "Laranja / âmbar" },
  { value: "green", label: "Verde / teal" },
  { value: "slate", label: "Cinzento ardósia" },
  { value: "rose", label: "Rosa" },
] as const

type PromoDuoBlock = Extract<HomeBlock, { type: "promoDuo" }>
type PromoDuoCell = PromoDuoBlock["props"]["items"][number]
type ShoeStoreHeroBlock = Extract<HomeBlock, { type: "shoeStoreHero" }>
type ShoeStoreHeroSlide = ShoeStoreHeroBlock["props"]["slides"][number]
type ShoeStoreExploreBlock = Extract<HomeBlock, { type: "shoeStoreExplore" }>
type ShoeStoreExploreTile = ShoeStoreExploreBlock["props"]["tiles"][number]

function PromoDuoCellFields({
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

export function StoreHomeBlockFields({ block, onChange }: StoreHomeBlockFieldsProps) {
  switch (block.type) {
    case "hero":
      return (
        <p className="text-[11px] text-muted-foreground">
          Banners geridos em <span className="font-medium text-foreground">Marketing → Banners</span> (posições hero / hero-side).
        </p>
      )
    case "shoeStoreHero": {
      const slides = block.props.slides
      const patchSlides = (next: typeof slides) => onChange({ ...block, props: { ...block.props, slides: next } })
      const defaultSlide = (): ShoeStoreHeroSlide => ({
        id: `slide-${slides.length + 1}`,
        tag: "Nova categoria",
        headline: "Headline.",
        ctaLabel: "Comprar",
        ctaHref: "/produtos",
        imageUrl:
          "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=2000&q=85",
        imageAlt: "Imagem lifestyle",
        imagePosition: "center",
      })
      return (
        <div className="grid gap-3">
          <div className="space-y-1">
            <Label className="text-[10px]">Autoplay (ms)</Label>
            <Input
              type="number"
              min={3000}
              max={15000}
              step={500}
              className="h-8 w-32 text-xs"
              value={block.props.autoplayMs ?? 5500}
              onChange={(e) =>
                onChange({
                  ...block,
                  props: {
                    ...block.props,
                    autoplayMs: Math.min(15000, Math.max(3000, Number(e.target.value) || 5500)),
                  },
                })
              }
            />
          </div>
          <p className="text-[10px] text-muted-foreground leading-snug">
            Entre 1 e 6 slides full-bleed. Imagem: URL https ou path <span className="font-mono">/</span>.
          </p>
          <div className="flex flex-col gap-3">
            {slides.map((slide, idx) => (
              <fieldset
                key={`${slide.id}-${idx}`}
                className="grid gap-2 rounded-md border border-border/60 bg-muted/10 p-2 sm:grid-cols-2"
              >
                <legend className="mb-1 px-1 text-[10px] font-semibold text-foreground">
                  Slide {idx + 1}
                </legend>
                <div className="space-y-1">
                  <Label className="text-[10px]">ID (interno)</Label>
                  <Input
                    className="h-8 text-xs font-mono"
                    value={slide.id}
                    onChange={(e) =>
                      patchSlides(slides.map((s, i) => (i === idx ? { ...s, id: e.target.value } : s)))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Tag</Label>
                  <Input
                    className="h-8 text-xs"
                    value={slide.tag}
                    onChange={(e) =>
                      patchSlides(slides.map((s, i) => (i === idx ? { ...s, tag: e.target.value } : s)))
                    }
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-[10px]">Headline</Label>
                  <Input
                    className="h-8 text-xs"
                    value={slide.headline}
                    onChange={(e) =>
                      patchSlides(slides.map((s, i) => (i === idx ? { ...s, headline: e.target.value } : s)))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Texto do botão</Label>
                  <Input
                    className="h-8 text-xs"
                    value={slide.ctaLabel}
                    onChange={(e) =>
                      patchSlides(slides.map((s, i) => (i === idx ? { ...s, ctaLabel: e.target.value } : s)))
                    }
                  />
                </div>
                <InternalPathField
                  label="Destino (path interno)"
                  value={slide.ctaHref}
                  allowEmpty={false}
                  placeholder="/produtos"
                  onChange={(ctaHref) =>
                    patchSlides(
                      slides.map((s, i) =>
                        i === idx ? { ...s, ctaHref: ctaHref?.trim() ? ctaHref : "/produtos" } : s
                      )
                    )
                  }
                />
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-[10px]">Imagem — URL https ou /path</Label>
                  <Input
                    className="h-8 text-xs font-mono"
                    value={slide.imageUrl}
                    onChange={(e) =>
                      patchSlides(slides.map((s, i) => (i === idx ? { ...s, imageUrl: e.target.value } : s)))
                    }
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-[10px]">Alt da imagem</Label>
                  <Input
                    className="h-8 text-xs"
                    value={slide.imageAlt}
                    onChange={(e) =>
                      patchSlides(slides.map((s, i) => (i === idx ? { ...s, imageAlt: e.target.value } : s)))
                    }
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-[10px]">Posição object (opcional)</Label>
                  <Input
                    className="h-8 text-xs font-mono"
                    placeholder="center 30%"
                    value={slide.imagePosition ?? ""}
                    onChange={(e) =>
                      patchSlides(
                        slides.map((s, i) =>
                          i === idx ? { ...s, imagePosition: e.target.value || undefined } : s
                        )
                      )
                    }
                  />
                </div>
                <div className="flex justify-end sm:col-span-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[10px]"
                    disabled={slides.length <= 1}
                    onClick={() => patchSlides(slides.filter((_, i) => i !== idx))}
                  >
                    Remover slide
                  </Button>
                </div>
              </fieldset>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            disabled={slides.length >= 6}
            onClick={() => patchSlides([...slides, defaultSlide()])}
          >
            Adicionar slide
          </Button>
        </div>
      )
    }
    case "shoeStoreExplore": {
      const tiles = block.props.tiles
      const patchTiles = (next: typeof tiles) => onChange({ ...block, props: { ...block.props, tiles: next } })
      const defaultTile = (): ShoeStoreExploreTile => ({
        id: `tile-${tiles.length + 1}`,
        label: "Nova categoria",
        href: "/produtos",
        span: "half",
        imageUrl:
          "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=900&q=80",
        imageAlt: "Categoria",
      })
      return (
        <div className="grid gap-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-[10px]">Título da secção</Label>
              <Input
                className="h-8 text-xs"
                value={block.props.title}
                onChange={(e) => onChange({ ...block, props: { ...block.props, title: e.target.value } })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">Texto «Ver tudo»</Label>
              <Input
                className="h-8 text-xs"
                value={block.props.seeAllLabel}
                onChange={(e) =>
                  onChange({ ...block, props: { ...block.props, seeAllLabel: e.target.value } })
                }
              />
            </div>
            <InternalPathField
              label="Destino «Ver tudo»"
              value={block.props.seeAllHref}
              allowEmpty={false}
              placeholder="/produtos"
              onChange={(seeAllHref) =>
                onChange({
                  ...block,
                  props: { ...block.props, seeAllHref: seeAllHref?.trim() ? seeAllHref : "/produtos" },
                })
              }
            />
          </div>
          <p className="text-[10px] text-muted-foreground leading-snug">
            Entre 2 e 6 tiles. Tamanho «hero» = grande (2×2); «half» = metade; «wide» = faixa larga.
          </p>
          <div className="flex flex-col gap-3">
            {tiles.map((tile, idx) => (
              <fieldset
                key={`${tile.id}-${idx}`}
                className="grid gap-2 rounded-md border border-border/60 bg-muted/10 p-2 sm:grid-cols-2"
              >
                <legend className="mb-1 px-1 text-[10px] font-semibold text-foreground">
                  Tile {idx + 1}
                </legend>
                <div className="space-y-1">
                  <Label className="text-[10px]">Label</Label>
                  <Input
                    className="h-8 text-xs"
                    value={tile.label}
                    onChange={(e) =>
                      patchTiles(tiles.map((t, i) => (i === idx ? { ...t, label: e.target.value } : t)))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Tamanho</Label>
                  <Select
                    value={tile.span}
                    onValueChange={(v) =>
                      patchTiles(
                        tiles.map((t, i) =>
                          i === idx ? { ...t, span: v as ShoeStoreExploreTile["span"] } : t
                        )
                      )
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hero">Hero (grande)</SelectItem>
                      <SelectItem value="half">Metade</SelectItem>
                      <SelectItem value="wide">Faixa larga</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <InternalPathField
                  className="sm:col-span-2"
                  label="Destino (path interno)"
                  value={tile.href}
                  allowEmpty={false}
                  placeholder="/produtos"
                  onChange={(href) =>
                    patchTiles(
                      tiles.map((t, i) =>
                        i === idx ? { ...t, href: href?.trim() ? href : "/produtos" } : t
                      )
                    )
                  }
                />
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-[10px]">Imagem — URL https ou /path</Label>
                  <Input
                    className="h-8 text-xs font-mono"
                    value={tile.imageUrl}
                    onChange={(e) =>
                      patchTiles(tiles.map((t, i) => (i === idx ? { ...t, imageUrl: e.target.value } : t)))
                    }
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-[10px]">Alt da imagem</Label>
                  <Input
                    className="h-8 text-xs"
                    value={tile.imageAlt}
                    onChange={(e) =>
                      patchTiles(tiles.map((t, i) => (i === idx ? { ...t, imageAlt: e.target.value } : t)))
                    }
                  />
                </div>
                <div className="flex justify-end sm:col-span-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[10px]"
                    disabled={tiles.length <= 2}
                    onClick={() => patchTiles(tiles.filter((_, i) => i !== idx))}
                  >
                    Remover tile
                  </Button>
                </div>
              </fieldset>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            disabled={tiles.length >= 6}
            onClick={() => patchTiles([...tiles, defaultTile()])}
          >
            Adicionar tile
          </Button>
        </div>
      )
    }
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
                <SelectItem value="curated">Seleção manual</SelectItem>
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
            <p className="text-[10px] text-muted-foreground tabular-nums">
              {block.props.limit} / {HOME_LAYOUT_RULES.railLimitMax} produtos mostrados neste rail
            </p>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-[10px]">Formato dos cartões</Label>
            <Select
              value={block.props.railCardStyle ?? "tile"}
              onValueChange={(v) =>
                onChange({
                  ...block,
                  props: { ...block.props, railCardStyle: v as "tile" | "row" },
                })
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tile">Vertical (scroll no telemóvel)</SelectItem>
                <SelectItem value="row">Horizontal em grelha</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground leading-snug">
              «row» = imagem à esquerda, stock, preço e botão «Ver produto»; grelha 1–3 colunas.
            </p>
          </div>
          <p className="text-[10px] text-muted-foreground leading-snug sm:col-span-2">
            {PRODUCT_RAIL_VARIANT_HELP[block.props.variant] ?? ""}
          </p>
          {block.props.variant === "curated" ? (
            <>
              <p className="text-[10px] text-muted-foreground tabular-nums sm:col-span-2">
                Seleccionados: {(block.props.productIds ?? []).length} / {HOME_LAYOUT_RULES.railLimitMax} (ordem =
                ordem na loja)
              </p>
              <CuratedProductPicker
                value={block.props.productIds ?? []}
                max={HOME_LAYOUT_RULES.railLimitMax}
                onChange={(productIds) => onChange({ ...block, props: { ...block.props, productIds } })}
              />
              <Collapsible className="sm:col-span-2">
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border border-dashed border-border/70 px-2 py-1.5 text-left text-[10px] text-muted-foreground hover:bg-muted/30">
                  <span>Lista em texto (UUID) — avançado</span>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-1.5">
                  <Label className="text-[10px] text-muted-foreground">
                    Um por linha ou separados por vírgula · máx. {HOME_LAYOUT_RULES.railLimitMax}
                  </Label>
                  <Textarea
                    className="mt-1 min-h-[72px] font-mono text-[11px] leading-relaxed"
                    placeholder="Opcional: cola UUID se preferires editar em massa."
                    value={(block.props.productIds ?? []).join("\n")}
                    onChange={(e) => {
                      const productIds = parseProductIdsFromText(
                        e.target.value,
                        HOME_LAYOUT_RULES.railLimitMax
                      )
                      onChange({ ...block, props: { ...block.props, productIds } })
                    }}
                  />
                </CollapsibleContent>
              </Collapsible>
            </>
          ) : null}
          <div className="space-y-1 sm:col-span-2">
            <Label className="flex items-center justify-between gap-2 text-[10px]">
              <span>Título</span>
              <span className="font-normal text-muted-foreground tabular-nums">
                {block.props.title.length}/{HOME_LAYOUT_RULES.titleMax}
              </span>
            </Label>
            <Input
              className="h-8 text-xs"
              value={block.props.title}
              onChange={(e) =>
                onChange({ ...block, props: { ...block.props, title: e.target.value } })
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
            placeholder="/produtos?sort=newest"
            onChange={(seeAllHref) => onChange({ ...block, props: { ...block.props, seeAllHref } })}
          />
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
            <Label className="text-[10px]">Variante</Label>
            <Select
              value={block.props.variant ?? "banner"}
              onValueChange={(v) =>
                onChange({
                  ...block,
                  props: { ...block.props, variant: v as "banner" | "strip" | "card" },
                })
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="banner">Banner (destaque escuro)</SelectItem>
                <SelectItem value="strip">Faixa compacta</SelectItem>
                <SelectItem value="card">Cartão centrado</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
    case "trustStrip": {
      const items = block.props.items
      const patchItems = (next: typeof items) => onChange({ ...block, props: { items: next } })
      const updateItem = (index: number, patch: Partial<(typeof items)[0]>) => {
        patchItems(items.map((it, i) => (i === index ? { ...it, ...patch } : it)))
      }
      const addItem = () => {
        if (items.length >= 4) return
        patchItems([...items, { icon: "card" as const, label: "Novo benefício", sublabel: "" }])
      }
      const removeItem = (index: number) => {
        if (items.length <= 2) return
        patchItems(items.filter((_, i) => i !== index))
      }
      return (
        <div className="grid gap-3">
          <p className="text-[10px] text-muted-foreground leading-snug">
            Entre 2 e 4 itens. Ícone + título curto; subtítulo opcional.
          </p>
          <div className="flex flex-col gap-3">
            {items.map((it, idx) => (
              <div
                key={idx}
                className="grid gap-2 rounded-md border border-border/60 bg-muted/10 p-2 sm:grid-cols-2"
              >
                <div className="space-y-1">
                  <Label className="text-[10px]">Ícone</Label>
                  <Select
                    value={it.icon}
                    onValueChange={(v) =>
                      updateItem(idx, { icon: v as (typeof it)["icon"] })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="truck">Caminhão (entrega)</SelectItem>
                      <SelectItem value="shield">Escudo (segurança)</SelectItem>
                      <SelectItem value="store">Loja física</SelectItem>
                      <SelectItem value="card">Cartão (pagamento)</SelectItem>
                      <SelectItem value="support">Auriculares (apoio)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-[10px]">Título</Label>
                  <Input
                    className="h-8 text-xs"
                    value={it.label}
                    onChange={(e) => updateItem(idx, { label: e.target.value })}
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-[10px]">Subtítulo (opcional)</Label>
                  <Input
                    className="h-8 text-xs"
                    value={it.sublabel ?? ""}
                    onChange={(e) => updateItem(idx, { sublabel: e.target.value || undefined })}
                  />
                </div>
                <div className="sm:col-span-2 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[10px]"
                    disabled={items.length <= 2}
                    onClick={() => removeItem(idx)}
                  >
                    Remover
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            disabled={items.length >= 4}
            onClick={addItem}
          >
            Adicionar item
          </Button>
        </div>
      )
    }
    case "productPair": {
      const pairIds = [block.props.leftProductId, block.props.rightProductId]
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          <p className="text-[10px] text-muted-foreground leading-snug sm:col-span-2">
            Escolhe exactamente dois produtos diferentes. A ordem na lista = esquerda e depois direita na loja.
          </p>
          <CuratedProductPicker
            value={pairIds}
            max={2}
            onChange={(ids) => {
              if (ids.length === 0) return
              const left = ids[0]!
              const right = ids.length >= 2 ? ids[1]! : block.props.rightProductId
              if (left === right) return
              onChange({ ...block, props: { ...block.props, leftProductId: left, rightProductId: right } })
            }}
          />
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-[10px]">Etiqueta (opcional)</Label>
            <Input
              className="h-8 text-xs"
              placeholder="Ex.: Destaque"
              value={block.props.eyebrow ?? ""}
              onChange={(e) =>
                onChange({
                  ...block,
                  props: { ...block.props, eyebrow: e.target.value || undefined },
                })
              }
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-[10px]">Título da secção (opcional)</Label>
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
            <Label className="text-[10px]">Layout em desktop</Label>
            <Select
              value={block.props.layout ?? "equal"}
              onValueChange={(v) =>
                onChange({
                  ...block,
                  props: { ...block.props, layout: v as "equal" | "asymmetric" },
                })
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equal">Dois cartões iguais (50/50)</SelectItem>
                <SelectItem value="asymmetric">Destaque + secundário (60/40)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )
    }
    case "promoDuo": {
      const items = block.props.items
      const patchItems = (next: typeof items) => onChange({ ...block, props: { items: next } })
      const defaultCell = (): PromoDuoCell => ({
        title: "Nova campanha",
        ctaLabel: "Ver",
        href: "/produtos",
        gradient: "blue",
      })
      return (
        <div className="grid gap-3">
          <p className="text-[10px] text-muted-foreground leading-snug">
            Entre 2 e 4 cartões. Cada um pode ter imagem (URL ou path <span className="font-mono">/</span>).
          </p>
          <div className="flex flex-col gap-3">
            {items.map((cell, idx) => (
              <div key={idx} className="flex flex-col gap-2">
                <PromoDuoCellFields
                  legend={`Cartão ${idx + 1}`}
                  cell={cell}
                  onChange={(next) => patchItems(items.map((it, i) => (i === idx ? next : it)))}
                />
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[10px]"
                    disabled={items.length <= 2}
                    onClick={() => patchItems(items.filter((_, i) => i !== idx))}
                  >
                    Remover cartão
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            disabled={items.length >= 4}
            onClick={() => patchItems([...items, defaultCell()])}
          >
            Adicionar cartão
          </Button>
        </div>
      )
    }
    case "splitDealRail":
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-[10px]">Etiqueta do painel (opcional)</Label>
            <Input
              className="h-8 text-xs"
              value={block.props.panelEyebrow ?? ""}
              onChange={(e) =>
                onChange({
                  ...block,
                  props: { ...block.props, panelEyebrow: e.target.value || undefined },
                })
              }
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-[10px]">Título do painel</Label>
            <Input
              className="h-8 text-xs"
              value={block.props.panelTitle}
              onChange={(e) => onChange({ ...block, props: { ...block.props, panelTitle: e.target.value } })}
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-[10px]">Descrição (opcional)</Label>
            <Textarea
              className="min-h-[72px] text-xs"
              value={block.props.panelDescription ?? ""}
              onChange={(e) =>
                onChange({
                  ...block,
                  props: { ...block.props, panelDescription: e.target.value || undefined },
                })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px]">Texto do botão</Label>
            <Input
              className="h-8 text-xs"
              value={block.props.panelCtaLabel}
              onChange={(e) => onChange({ ...block, props: { ...block.props, panelCtaLabel: e.target.value } })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px]">Gradiente do painel</Label>
            <Select
              value={block.props.panelGradient}
              onValueChange={(v) =>
                onChange({
                  ...block,
                  props: { ...block.props, panelGradient: v as (typeof block.props)["panelGradient"] },
                })
              }
            >
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
            label="Destino do botão (path interno)"
            value={block.props.panelCtaHref}
            allowEmpty={false}
            placeholder="/ofertas"
            onChange={(panelCtaHref) =>
              onChange({
                ...block,
                props: { ...block.props, panelCtaHref: panelCtaHref?.trim() ? panelCtaHref : "/ofertas" },
              })
            }
          />
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-[10px]">Imagem do painel (opcional) — URL https ou /path</Label>
            <Input
              className="h-8 text-xs font-mono"
              placeholder="https://… ou /banner.png"
              value={block.props.panelImageUrl ?? ""}
              onChange={(e) =>
                onChange({
                  ...block,
                  props: { ...block.props, panelImageUrl: e.target.value || undefined },
                })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px]">Variante produtos</Label>
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
                <SelectItem value="curated">Seleção manual</SelectItem>
                <SelectItem value="bestsellers">Mais vendidos</SelectItem>
                <SelectItem value="on_sale">Em promoção</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px]">N.º produtos (4–8)</Label>
            <Input
              type="number"
              min={4}
              max={8}
              className="h-8 text-xs"
              value={block.props.limit}
              onChange={(e) =>
                onChange({
                  ...block,
                  props: { ...block.props, limit: Math.min(8, Math.max(4, Number(e.target.value) || 4)) },
                })
              }
            />
            <p className="text-[10px] text-muted-foreground tabular-nums">
              {block.props.limit} produtos (permitido 4–8)
            </p>
          </div>
          <p className="text-[10px] text-muted-foreground leading-snug sm:col-span-2">
            {PRODUCT_RAIL_VARIANT_HELP[block.props.variant] ?? ""}
          </p>
          {block.props.variant === "curated" ? (
            <>
              <p className="text-[10px] text-muted-foreground tabular-nums sm:col-span-2">
                Seleccionados: {(block.props.productIds ?? []).length} / 8
              </p>
              <CuratedProductPicker
                value={block.props.productIds ?? []}
                max={8}
                onChange={(productIds) => onChange({ ...block, props: { ...block.props, productIds } })}
              />
            </>
          ) : null}
          <InternalPathField
            className="sm:col-span-2"
            label="«Ver todos» da grelha (opcional)"
            value={block.props.seeAllHref}
            allowEmpty
            placeholder="/ofertas"
            onChange={(seeAllHref) => onChange({ ...block, props: { ...block.props, seeAllHref } })}
          />
        </div>
      )
    default:
      return null
  }
}
