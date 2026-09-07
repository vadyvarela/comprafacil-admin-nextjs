"use client"

import {
  CuratedProductPicker,
  Input,
  InternalPathField,
  Label,
  PRODUCT_RAIL_VARIANT_HELP,
  PROMO_GRADIENT_OPTIONS,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "./shared"
import type { BlockFieldsProps, HomeBlock } from "./shared"

type Block = Extract<HomeBlock, { type: "splitDealRail" }>

export function SplitDealRailFields({ block, onChange }: BlockFieldsProps<Block>) {
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
          <Label className="text-[10px]">N.º produtos (4–10)</Label>
          <Input
            type="number"
            min={4}
            max={10}
            className="h-8 text-xs"
            value={block.props.limit}
            onChange={(e) =>
              onChange({
                ...block,
                props: { ...block.props, limit: Math.min(10, Math.max(4, Number(e.target.value) || 4)) },
              })
            }
          />
          <p className="text-[10px] text-muted-foreground tabular-nums">
            {block.props.limit} produtos (permitido 4–10)
          </p>
        </div>
        <p className="text-[10px] text-muted-foreground leading-snug sm:col-span-2">
          {PRODUCT_RAIL_VARIANT_HELP[block.props.variant] ?? ""}
        </p>
        {block.props.variant === "curated" ? (
          <>
            <p className="text-[10px] text-muted-foreground tabular-nums sm:col-span-2">
              Seleccionados: {(block.props.productIds ?? []).length} / 10
            </p>
            <CuratedProductPicker
              value={block.props.productIds ?? []}
              max={10}
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
}
